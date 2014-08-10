<?php
	$data = array(
		'ok' => '成功退出登录'
	);
	setcookie('status',false,0,'/');
	echo json_encode($data);
?>