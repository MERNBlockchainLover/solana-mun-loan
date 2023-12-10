<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); //Date in the past
header("Content-Type:application/json");
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

// SQL query to select all records from the table
$sql = "SELECT collection_name, collection_image_url FROM Collections";
$result = $conn->query($sql);

// Check if there are any records
if ($result->num_rows > 0) {
    // Fetch all rows and store them in an associative array
    $records = array();
    while ($row = $result->fetch_assoc()) {
        $records[] = $row;
    }

    $response  = [];
    $response['data'] =  $records;

    echo json_encode($response, JSON_PRETTY_PRINT);
} else {
    echo "0 results";
}

// Close the connection
$conn->close();
?>