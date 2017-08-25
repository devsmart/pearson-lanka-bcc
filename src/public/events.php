<?php

if(!$_GET || !isset($_GET["id_token"])){
	header("HTTP/1.1 401 Unauthorized"); 
    exit;
}
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
$service_url = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' . $_GET["id_token"];

$curl = curl_init($service_url);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
$curl_response = curl_exec($curl);
if ($curl_response === false) {
    $info = curl_getinfo($curl);
    curl_close($curl);
    die('error occured during curl exec. Additioanl info: ' . var_export($info));
}
curl_close($curl);

$decoded = json_decode($curl_response);
if (isset($decoded->response->status) && $decoded->response->status == 'ERROR') {
    die('error occured: ' . $decoded->response->errormessage);
}

$people = array('harshana.weerasinghe@pearson.com', 'anura.dealwis@pearson.com');
	
if (in_array( $decoded->email, $people)){
 	if ($_SERVER['REQUEST_METHOD'] === 'POST' ) {
		
		$content = trim(file_get_contents("php://input"));
		$myfile = fopen(date("Y").'_data.json', "w") or die("Unable to open file!");	 
		fwrite($myfile, $content);
		fclose($myfile);
		header("HTTP/1.1 201 Created");
		exit;		
	}else if($_SERVER['REQUEST_METHOD'] === 'GET' ) {
		//return data 
		$data = file_get_contents(date("Y").'_data.json');
		header('Content-Type: application/json');
		echo json_encode($data);
	}else{
		header("HTTP/1.1 204");
		exit;
	}
}else{
	header("HTTP/1.1 401 Unauthorized");
    exit;
}
?>