define(function(require){
	var isMobile = false;
	var cookie = require('./common/cookie');
	var JSON = require('./common/json');
	var session = require('./session');
	var app = GBROS.app;
	var $loadingBox = $('#loading-box');
	window.COMS = {};
	var appTpl = '';
	var nav = require('./nav');
	//定义应用导航资源模型
	var navModel = new nav.Model;
	
	//载入应用
	var loadApp = function(){
		
		//同步载入应用模板文件
		appTpl = appTpl ? appTpl : $.ajax({
		  url: GBROS.path + "/Rainbow/application/templates/app/" + (app.theme ? app.theme : 'app.html'),
		  async: false
		}).responseText;
		
		
		//定义导航资源请求成功回调函数
		var success = function(model,data){
			if(data.unlogin){
				GBROS.logout();
				return;
			}
			
			if(data.error){
				alert(data.error);
				return;
			}
			
			_.templateSettings = {
			  interpolate : /\{\{(.+?)\}\}/g
			};
			$app = $(_.template(
				appTpl,
				{app:app,user:model.get('user')},
				{interpolate : /\{\{(.+?)\}\}/g}
			));
			_.templateSettings = {
			  interpolate : /<%=([\s\S]+?)%>/g
			  //,escape: /<[\s\S]+?>/g
			};
			$loadingBox.hide();
			$('#gbros-app-box').append($app);
			
			COMS.formUI = require('./ui/form');
			COMS.viewForm = require('./view/form');
			COMS.viewCompontent = require('./view/compontent');
			COMS.view = require('./view/view');
			COMS.viewModel = require('./view/model');
			
			
			COMS.editor = require('./ui/editor');
			COMS.tree = require('./ui/tree');
			var appRoles = model.get('user').appRoles;
			if(appRoles.length > 0){
				for(var i = 0; i < appRoles.length; i++){
					if(appRoles[i]['appId'] === GBROS.app.id){
						for(var j = 0; j < appRoles[i].roles.length; j++){
							$('#J-roles .dropdown-menu').append(
								'<li role="presentation" style="display:block;"><a role="menuitem" tabindex="-1" href="'
								+ GBROS.changeRoleUrl + '?roleKey=' + appRoles[i]['roles'][j]['roleKey']
								+'">' + appRoles[i]['roles'][j]['roleName'] + '</a></li>'
							);
						}
					}
				}
			}
			navModel.render();
		};
		
		//定义导航资源请求失败回调函数
		var error = function(model){
			if(confirm('访问服务器失败，是否重试?')){
				model.request(success,error);
			}else{
				return false;
			}
		};
		
		//请求导航资源模型
		navModel.url = GBROS.path + GBROS.sessionUrl;
		navModel.request(success,error);
	};
	
	//获取Session视图模型
	var fechSessionModel = function(){
		
	};
	
	//登录成功回调
	var loginSuccess = function(){
		loadApp();
	};
	
	//初始化登录框视图
	var loginBox = new session.LoginBox({
		appId:app.id,
		url:GBROS.path + GBROS.loginUrl,
		success:loginSuccess
	});
	
	//将登录框添加到界面主体
	loginBox.$el.appendTo('body').hide();
	
	var status = cookie.get('status');
	if(!status || status == 0){
		loginBox.$el.fadeIn("slow");
	}else{
		loadApp();
	}
	
	GBROS.logout = function(){
		var success = function(){
			loginBox.$el.fadeIn("slow");
			$('#user-box').empty();
			$('#gbros-app-box').empty();
		};
		session.logout(GBROS.path + GBROS.logoutUrl,success);
	};
	
	//退出登录事件监听
	$('#J-logout a').live('click',function(){
		GBROS.logout();
	});
});