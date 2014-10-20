define(function(require){
	var nav;
	var navs = {};
	
	//URL锚点自动路由
	var hashRouter = function(nav){
		var hash = window.location.hash;
		hash = hash == '#'?'':hash;
		
		//监听锚点事件
		$(window).hashchange(function(){
			if(!GBROS.stopRouter){
				nav.router(window.location.hash.slice(2));
			}else{
				GBROS.stopRouter = false;
			}
		});
		
		//执行路由
		if(hash){
			nav.router(hash.slice(2));
		}else{
			window.location.hash = '!' + nav.get('resources')[0]['resCode'];	
		}
	};
	
	//视图导航
	var viewNav = function(id, breadcrumb, param, url){
		var Model = COMS.viewModel;
		var model = new Model;
		model.set('breadcrumb',breadcrumb);
		model.set('_param',param);
		model.set('_resId',id);
		
		if(param.length && param[0].indexOf('=') != -1){
			var _param = param[0].split('=');
			model.filterModel.set(_param[0],_param[1],{silent:true});
		}
		
		if(url){
			model.set('_url',url);
			var view = new COMS.view.Iframe({model:model}).render();
		}else{
			model.url = './tests/engine/list-view.php?id=' + id;
			if(!GBROS.debug){
				 model.url = GBROS.viewPath + id;
			}
			$('#J-view').data('id',id).empty().addClass('loading');
			model.request();
		}	
	};
	
	//菜单视图定义
	var Menu = Backbone.View.extend({
		tagName:'li',
		events:{
			'click':'onClick'
		},
		render:function(){
			this.$el.html(_.template($('#tpl-nav-menu-li').html(),this.model.toJSON()));
			
			//合并父节点传递的面包屑参数
			this.breadcrumb = [];
			this.breadcrumb = this.breadcrumb.concat(
				this.options.breadcrumb,
				{name:this.model.get('resName'),id:this.model.get('resCode')}
			);
			
			//生成子菜单
			if(this.model.get('childList') && this.model.get('resType') !== 'view'){
				this.subMenu();
			}
			return this;	
		},
		subMenu:function(){
			var menu = new Backbone.View({tagName:'ul',className:'sub'});
			var list = this.model.get('childList');
			for(var i in list){
				this.subMenus[list[i]['resCode']] = new Menu({
					model:new Backbone.Model(list[i]),
					code:this.code,
					breadcrumb:this.breadcrumb,
					parent:this
				});
				menu.$el.append(this.subMenus[list[i]['resCode']].render().el);
			}
			menu.$el.hide();
			this.$el.append(menu.el);
		},
		initialize:function(){
			this.code = this.options.code + '/' + this.model.get('resCode');
			this.subMenus = {};
		},
		onClick:function(){
			var hash = '!';
			for(var i = 0; i < this.breadcrumb.length ; i++){
				hash += (i)?'/':'';
				hash += this.breadcrumb[i].id;
			}
			window.location.hash = hash;
			return false;
		},
		on:function(param){
			if(!this.$el.hasClass('on')){
				this.$el.addClass('on');
				this.$el.siblings().removeClass('on').find('.on').removeClass('on');
				this.$el.siblings().find('ul.sub').slideUp();
				this.$el.find('ul.sub').slideDown();	
			}
			if(this.model.get('resType') === 'view'){
				viewNav(this.model.get('resKey'),this.breadcrumb,_.clone(param));
			}else if(this.model.get('resType') === 'link' && this.model.get('resUrl')){
				viewNav(this.model.get('resKey'),this.breadcrumb,_.clone(param),this.model.get('resUrl'));
			}
		},
		router:function(hash){
			var router = hash[0];
			this.on(hash);
			hash.shift();
			if(router && this.subMenus[router]){
				this.subMenus[router].router(hash);
			}else if(!router && this.model.get('childList') && this.model.get('resType') !== 'view'){
				window.location.hash = window.location.hash + '/' + this.model.get('childList')[0].resCode;
			}
		}
	});
	
	//根菜单视图定义
	var RootMenu = Backbone.View.extend({
		tagName:'li',
		events:{
			'click':'onClick'
		},
		render:function(){
			this.breadcrumb = [{name:this.model.get('resName'),id:this.model.get('resCode')}];
			this.$el.html(_.template($('#tpl-nav-root-li').html(),this.model.toJSON()));
			return this;
		},
		renderSubMenu:function(){
			$('#J-nav-menu>ul').empty();
			var list = this.model.get('childList');
			for(var i in list){
				this.subMenus[list[i]['resCode']] = this.addChild(new Backbone.Model(list[i]));
			}
		},
		addChild:function(model){
			var v = new Menu({model:model,code:this.code,breadcrumb:this.breadcrumb,parent:this});
			$('#J-nav-menu>ul').append(v.render().el);
			return v;
		},
		onClick:function(){
			var hash = '!' + this.model.get('resCode');
			window.location.hash = hash;
			return false;
		},
		on:function(param){
			if(!this.$el.hasClass('on')){
				this.$el.siblings().removeClass('on');
				this.$el.addClass('on');
				this.renderSubMenu();
			}
			if(this.model.get('resType') === 'catalog'){
				$('#J-nav-menu').show();
				$('#container').css('margin-left',$('#J-nav-menu').outerWidth());
				
			}else if(this.model.get('resType') === 'view'){
				$('#J-nav-menu').hide();
				$('#container').css('margin-left',0);
				viewNav(this.model.get('resKey'),this.breadcrumb,_.clone(param));
			}
		},
		initialize:function(){
			this.subMenus = {};
			this.render();
			this.code = this.model.get('resCode');
			this.hashParam;
		},
		router:function(hash){
			this.on(hash);
			var router = hash[0];
			hash.shift();
			if(router && this.subMenus[router]){
				this.subMenus[router].router(hash);
			}else if(!router && this.model.get('childList') && this.model.get('resType') === 'catalog'){
				window.location.hash = window.location.hash + '/' + this.model.get('childList')[0].resCode;
			}
		}
	});
	
	//导航资源模型定义
	var Model = Backbone.Model.extend({
		request:function(success,error){
			this.fetch({
				success:success,
				data:{_time:new Date().getTime(),appId:GBROS.app.id},
				error:error
			});
		},
		render:function(){
			var list = this.get('resources');
			this.rootMenu = {};
			for(var i = 0; i < list.length; i++ ){
				this.rootMenu[list[i]['resCode']] = new RootMenu({model:new Backbone.Model(list[i]),code:list[i]['resCode']});
				$('#J-nav-root').append(this.rootMenu[list[i]['resCode']].el);
			}
			hashRouter(this);
		},
		initialize: function() {
			
		},
		router:function(hash){
			hash = hash.split('/');
			var router = hash[0];
			hash.shift();
			if(router  && this.rootMenu[router]){
				this.rootMenu[router].router(hash);
			}
		},
		autoRouter:function(){
			hashRouter(this);
		}
	});
	
	nav = {
		Model:Model,
		RootMenu:RootMenu
	};
	return nav;
});