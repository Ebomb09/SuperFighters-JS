<!DOCTYPE html>
<html>

<head>

</head>

<body>

	<canvas id="sf-canvas">
	The canvas tag is not supported on your browser.
	</canvas>

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