<?php
	if($_POST['userId'] == 'admin' && $_POST['password'] == '123456'){
		$data = array(
			'ok'    => '登录成功',
			'code'  => '0',
			'data'  => NULL
		);
		setcookie('status',1,0,'/');
	}else{
		$data = array(
			'error'    => '用户名或密码错误',
			'code'  => '0',
			'data'  => NULL
		);
	}
	
	echo json_encode($data);
?>