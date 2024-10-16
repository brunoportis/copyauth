use std::env;
use std::io::{self, Write, BufReader, Read};
use std::process::{Command, Stdio};
use serde_json::Value;
use warp::Filter;

#[tokio::main]
async fn main() {
    // Capture command-line arguments
    let args: Vec<String> = env::args().collect();

    // Ensure the app is run with the correct command
    if args.len() < 3 || args[1] != "--command" {
        eprintln!("Usage: myapp --command \"<command>\"");
        std::process::exit(1);
    }

    // Get the command to execute
    let command_input = args[2].clone();

    // Define a CORS filter
    let cors = warp::cors()
        .allow_any_origin() // Allow any origin (for testing; restrict in production)
        .allow_methods(vec!["POST"]) // Allow POST requests
        .allow_headers(vec!["Content-Type"]); // Allow Content-Type header

    // Define a route to receive POST requests
    let route = warp::post()
        .and(warp::path("receive"))
        .and(warp::body::bytes()) // Capture the raw bytes of the request body
        .map({
            let command_input = command_input.clone();
            move |payload: bytes::Bytes| {
                // Prepare to execute the command
                let mut command = Command::new("sh")
                    .arg("-c") // Use -c to pass the command as a string
                    .arg(&command_input) // Pass the command string
                    .stdin(Stdio::piped()) // Allow piping input
                    .stdout(Stdio::piped()) // Capture the output
                    .stderr(Stdio::piped()) // Capture error output
                    .spawn() // Spawn the command
                    .expect("Failed to start command");

                // Write the payload content to the command's stdin
                {
                    let stdin = command.stdin.as_mut().expect("Failed to open stdin");
                    stdin.write_all(&payload).expect("Failed to write to stdin");
                }

                // Wait for the command to finish and capture the output
                let output = command.wait_with_output().expect("Failed to read output");

                // Check if the command was successful
                if output.status.success() {
                    // Print the command's stdout to console
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    println!("Command output:\n{}", stdout);
                    "Command executed successfully".to_string()
                } else {
                    // If there's an error, print the error output
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    eprintln!("Error executing command:\n{}", stderr);
                    "Command execution failed".to_string()
                }
            }
        });

    // Start the server with CORS support
    println!("Server running on http://localhost:3030/receive");
    warp::serve(route.with(cors)).run(([127, 0, 0, 1], 3030)).await;
}
