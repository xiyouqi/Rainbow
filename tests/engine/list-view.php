<?php
	$_GET['_page'] = isset($_GET['_page'])?$_GET['_page']:1;
	for($i=0;$i<12;$i++){
		$body[] = array(
					'iid'    => $i,
					'title' => '第'.$_GET['_page'].'<b class="">页</b>内容标题'.$i,
					'time'  => date('Y-n-j H:i:s'),
					'amount'=> '99.00',
					'status'=> true
				);
	}
	
	$data = array(
		'id'     => 1,
		'name'   => '测试视图',
		'title'      => '测试视图标题',
		'type'       => 'list',
		'mode'       => '',
		'tpl'        => '',
		'trTpl'      => '',
		'action'     => array(
			array(
				'id'       => '1',
				'name'     => '添加',
				'desc'     => '添加新数据',
				'event'    => 'creat',
				'iconUrl'  => 'icon-plus',
				'primary'  => '1'
			),
			array(
				'id'       => '2',
				'name'     => '修改',
				'desc'     => '修改数据',
				'event'    => 'edit',
				'iconUrl'  => 'icon-edit',
				'group'    => true,
				'primary'  => ''
			),
			array(
				'id'       => '3',
				'name'     => '删除',
				'event'    => 'remove',
				'iconUrl'  => 'icon-trash',
				'primary'  => ''
			),
			array(
				'id'       => '4',
				'name'     => '批量处理',
				'event'    => 'batch',
				'iconUrl'  => 'icon-edit',
				'group'    => true,
				'primary'  => ''
			),
			array(
				'iid'       => '5',
				'name'     => '上传',
				'event'    => 'upload',
				'iconUrl'  => 'icon-upload',
				'primary'  => '',
				'desc'     => '文件上传'
			),
			array(
				'iid'       => '6',
				'name'     => '刷新',
				'event'    => 'refresh',
				'iconUrl'  => 'icon-refresh',
				'primary'  => '',
				'desc'     => '刷新视图数据',
				'group'    => true
			)
		),
		'attr'     => array(
			'idName'         => 'iid',
			'parentKeyName'  => '',
			'head'           => array(
				array(
					'name'         => 'iid',
					'alias'        => '主键',
					'display'      => true,
					'creat'        => false,
					'edit'         => false,
					'value'        => '',
					'dataType'     => 'key',
					'mateType'     => 'string',
					'required'     => true,
					'max'          => 32,
					'form'         => 'text',
					'isTitle'      => false,
					'attr'         => array('width' => '20','style' => "text-align:center"),
					'tpl'          => '<input name="" type="checkbox" value="">'
				),
				array(
					'name'         => 'title',
					'alias'        => '标题',
					'display'      => true,
					'creat'        => true,
					'edit'         => true,
					'value'        => '',
					'dataType'     => '',
					'metaType'     => '',
					'required'     => true,
					'max'          => 5,
					'min'          => 2,
					'form'         => 'text',
					'isTitle'      => true
				),
				array(
					'name'         => 'time',
					'alias'        => '时间',
					'display'      => true,
					'creat'        => true,
					'edit'         => false,
					'value'        => '',
					'dataType'     => 'time',
					'metaType'     => '',
					'required'     => true,
					'max'          => 256,
					'form'         => 'text',
					'isTitle'      => false
				),
				array(
					'name'         => 'amount',
					'alias'        => '金额',
					'display'      => true,
					'creat'        => true,
					'edit'         => true,
					'value'        => '',
					'dataType'     => 'number',
					'metaType'     => 'float',
					'required'     => true,
					'max'          => 15,
					'form'         => 'text',
					'isTitle'      => false
				),
				array(
					'name'         => 'status',
					'alias'        => '状态',
					'display'      => true,
					'creat'        => true,
					'edit'         => true,
					'value'        => '',
					'dataType'     => '',
					'metaType'     => 'bool',
					'required'     => false,
					'max'          => 1,
					'form'         => 'checkbox',
					'isTitle'      => false
				)
			),
			'filter'         => array(
				array(
					'name' => 'title',
					'type' => 'where'
				)
			)
		),
		'data'       => array(
			'body'       => $body,
			'page'       => array(
				'count'    => 100,
				'page'     => 1,
				'pagesize' => 10,
				'pageCount'=> 10
			)
		),
		'setting'    => NULL,
		'autoView'   => true,
		'测试'        => '测试'
	);
	
	echo json_encode($data);
?>