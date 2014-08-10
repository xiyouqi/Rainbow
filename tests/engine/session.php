<?php
	$data = array(
		'resources' => array(
			array(
				'resKey'   => '2',
				'resCode'  => 'Model',
				'resName'  => '信息模型',
				'resType'  => 'catelog',
				'childList'=> array(
					array(
						'resKey'   => '21',
						'resCode'  => 'Manager',
						'resName'  => '模型管理',
						'resType'  => 'catelog',
						'resUrl'   => '/tests/engine/list-view.php',
						'iconUrl'  => '',
						'childList'=> array(
							array(
								'resKey'   => '211',
								'resCode'  => 'Index',
								'resName'  => '模型管理',
								'resType'  => 'view',
								'resUrl'   => '/tests/engine/list-view.php',
								'iconUrl'  => '',
								'autoView' => true
							),
							array(
								'resKey'   => '212',
								'resCode'  => 'Domain',
								'resName'  => '主题域',
								'resType'  => 'view',
								'resUrl'   => '/tests/engine/list-view.php',
								'iconUrl'  => '',
								'autoView' => true
							)
						)
					),
					array(
						'resKey'   => '22',
						'resCode'  => 'DataType',
						'resName'  => '数据类型',
						'resType'  => 'view',
						'iconUrl'  => '',
						'resUrl'   => '/tests/engine/list-view.php'
					)
				)
			),
			array(
				'resKey'   => '4',
				'resCode'  => 'Access',
				'resName'  => '云数据',
				'resType'  => 'view'
			),
			array(
				'resKey'   => '4',
				'resCode'  => 'Storage',
				'resName'  => '云存储',
				'resType'  => 'view'
			),
			array(
				'resKey'   => '1',
				'resCode'  => 'App',
				'resName'  => '应用管理',
				'resType'  => 'view',
				'iconUrl'  => '',
				'resUrl'   => '/tests/engine/doc-view.php'
			)
		),
		'user' => array(
			'userId'         => 'admin',
			'userName'       => '马志荣',
			'roleName'       => '系统管理员',
			'roleKey'        => '0',
			'orgName'        => '研发部',
			'orgKey'         => '1'
		)	
	);
	
	echo json_encode($data);

?>