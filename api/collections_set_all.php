<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); //Date in the past
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

$servername = "localhost";
$username = "u0hrjr17gwqfz";
$password = "#@%14#@F[n/3";
$dbname = "db50g5xgurwpgc";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if data is sent via POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Decode JSON data from the POST request
    $postData = json_decode(file_get_contents("php://input"), true);

    if ($postData !== null) {
        // Truncate the table
        $conn->query("TRUNCATE TABLE Collections");

        // Insert received data into the table
        foreach ($postData as $record) {
            $collectionName = $conn->real_escape_string($record['collection_name']);
            $imageUrl = $conn->real_escape_string($record['collection_image_url']);

            $sqlInsert = "INSERT INTO Collections (collection_name, collection_image_url) VALUES ('$collectionName', '$imageUrl')";
            $conn->query($sqlInsert);
        }

        $response  = [];
        $response['message'] = "Data received and inserted successfully into Collections";
        echo json_encode($response, JSON_PRETTY_PRINT);
    } else {
        // Handle invalid JSON data
        $response  = [];
        $response['error'] = "Invalid JSON data received";
        echo json_encode($response, JSON_PRETTY_PRINT);
    }
} else {
    // Handle requests other than POST
    $response  = [];
    $response['error'] = "Invalid request method";
    echo json_encode($response, JSON_PRETTY_PRINT);
}

// Close the connection
$conn->close();
?>