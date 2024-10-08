<!DOCTYPE html>
<html>

<head>
	<link rel="stylesheet" href="css/index.css">
	<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
</head>

<body>

	<div id="sf">
		<canvas id="sf-canvas" tabindex="1">
		The canvas tag is not supported on your browser.
		</canvas>

		<div id="sf-docs"></div>
	</div>

	<!-- Master Server Names -->
	<script>
		const master_server = "wss://<?php echo $_SERVER['SERVER_NAME']; ?>/wss/sf-js";
	</script>

	<!-- API Scripts -->
<?php

	$scan = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator("api", RecursiveDirectoryIterator::SKIP_DOTS)
		);

	foreach($scan as $file){
?>
	<script src="<?php echo $file; ?>"> </script>
<?php
	}
?>

	<!-- Game Runtime Scripts --> 
<?php
	$scan = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator("js", RecursiveDirectoryIterator::SKIP_DOTS)
		);

	foreach($scan as $file){
?>
	<script src="<?php echo $file; ?>" type="module"> </script>
<?php
	}
?>

</body>

</html>