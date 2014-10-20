define(function(require){
	var compontent = COMS.viewCompontent;
	//基础视图定义
	var Base = Backbone.View.extend({
		tagName:'div',
		className:'view-container',
		initialize:function(){
			$(window).on('resize',$.proxy(this,'setBodyHeight'));
			this.isNested = this.options.isNested;
			this.nestedLevel = this.options.nestedLevel ? this.options.nestedLevel : 1;
			this._cacheWordbook = {};
			this._cacheEnum = {};
		},
		//销毁视图
		destroy:function(){
			$(window).unbind('resize',$.proxy(this,'setBodyHeight'));
			this.remove();
			//delete this;
		},
		setBodyHeight:function(){
			var h = $('#header').outerHeight();
			if(this.nestedLevel > 1){
				h += 66 * (this.nestedLevel-1);
			}
			var vh = this.$('.view-header').eq(0).outerHeight();
			var vch = this.$('.view-content-header').eq(0).outerHeight();
			var f = this.$('.view-footer').eq(0).outerHeight();
			this.$('.view-content-body').eq(0).height(
				$(window).innerHeight() - h - vh - vch -f
			);
			$('#J-view').height($(window).innerHeight() - h);
			return this;
		},
		loading:function(){
			
		},
		completeLoading:function(){
			
		},
		error:function(){
			
		},
		hide:function(){
			$(window).unbind('resize',$.proxy(this,'setBodyHeight'));
			this.$el.hide();
			return this;
		},
		show:function(){
			this.$el.show();
			this.setBodyHeight();
			$(window).on('resize',$.proxy(this,'setBodyHeight'));
			return this;
		}
	});
	
	//简单视图定义
	var Simple = Base.extend({
		render:function(){
			return this;
		}
	});
	
	//辅助视图
	var Aid = Base.extend({
		initialize:function(){
			Base.prototype.initialize.apply(this, arguments);
			this.mainView = this.options.main;
			this.mainAction = this.options.action;
		},
		render:function(){
			this.mainView.hide();
			this.mainView.$el.after(this.el);
			this.show();
			return this;
		}
	});
	
	//iframe视图
	var Iframe = Base.extend({
		template:_.template($('#tpl-view-iframe-layout').html()),
		initialize:function(){
			Base.prototype.initialize.apply(this, arguments);
		},
		render:function(){
			var iframe = '<iframe name="" frameborder="0" src="' + this.model.get('_url') + '"'
			+ 'height="100%" width="100%" style="visibility: visible;"></iframe>';
			$('#J-view').html(this.el);
			this.$el.append(this.template());
			this.setBodyHeight();
			this.breadcrumb();
			this.$('.J-view-content-body').html(iframe).css('padding',0);
			return this;
		},
		breadcrumb:function(){
			var v = new compontent.Breadcrumb({
				collection:new Backbone.Collection(this.model.get('breadcrumb')),
				view:this
			});
			this.$('.J-view-breadcrumb').html(v.render().el);
		}
	});
	
	var NodeModel = Backbone.Model.extend({
		idAttribute:'NODE_KEY'
	});
	
	
	//预览导航项定义
	var PreviewBreadcrumb =  Backbone.View.extend({
		tagName:'li',
		events:{
			'click':'onClick'
		},
		initialize:function(){
			this.slide = this.options.slide;
		},
		render:function(){
			var html = ' <span>></span> <a href="javascript:void(0);"><%=name%></a>';
			this.$el.html(_.template(html,this.model.toJSON()));
			return this;
		},
		onClick:function(e){
			this.slide.view.slides[this.model.get('id')].show();
		}
	});
	
	//预览内容
	var PreviewContent = Backbone.View.extend({
		tagName:'table',
		className:'preview-content-table',
		attributes:{
			width:'100%',
			height:'100%'
		},
		initialize:function(){
			this.slide = this.options.slide;
		},
		render:function(){
			this.$el.html($('#tpl-disk-preview-content').html());
			return this;
		}
	});
	
	//预览内容菜单项
	var ContentMenuItem = Backbone.View.extend({
		tagName:'li',
		events:{
			'click':'onClick'
		},
		initialize:function(){
			this.slide = this.options.slide;
			this.model.on('change:_active',this.onClick,this);
		},
		render:function(){
			var html = '<a href="javascript:void(0);"><%=NODE_NAME%></a>';
			this.$el.html(_.template(html,this.model.toJSON()));
			return this;
		},
		onClick:function(e){
			this.$el.siblings().removeClass('active');
			this.$el.addClass('active');
			this.slide.$('.preview-content-table').hide();
			if(this.slide.contentViews[this.model.get('NODE_KEY')]){
				this.slide.contentViews[this.model.get('NODE_KEY')].$el.show();
			}else{
				this.slide.renderContent(this.model);	
			}
		}
	});
	
	//目录导航菜单项
	var CatalogMenuItem = Backbone.View.extend({
		tagName:'li',
		events:{
			'click':'onClick'
		},
		initialize:function(){
			this.slide = this.options.slide;
		},
		render:function(){
			var html = '<%=NODE_NAME%>';
			this.$el.html(_.template(html,this.model.toJSON()));
			return this;
		},
		onClick:function(){
			if(this.model.get('NODE_KEY') === this.slide.model.get('NODE_KEY')){
				this.$el.siblings().removeClass('active');
				this.$el.addClass('active');
				this.slide.$('.preview-content-table').hide();
				this.slide.renderMenu(this.model);
			}else{
				//this.slide.renderCatalog(this.model);
				this.slide.view.creatSlide(this.model,this.slide);
			}
		}
	});
	
	//文件项
	var FileItem =  Backbone.View.extend({
		tagName:'li',
		events:{
			'click .J-cell-title':'onClick'
		},
		initialize:function(){
			this.slide = this.options.slide;
		},
		render:function(){
			var html = '<div>'
			+'<span class="fn-iblock file-icon-small" style="width:34px;height:34px;margin-right:5px;">&nbsp;</span>'
			+'<span class="fn-iblock" style="font-size:13px;"><a href="javascript:void(0);" class="J-cell-title"><%=NODE_NAME%></a></span></div>';
			this.$el.html(_.template(html,this.model.toJSON()));
			var file_types = {
				doc : 'file-icon-doc',
				docx: 'file-icon-doc',
				ppt : 'file-icon-ppt',
				pptx: 'file-icon-ppt',
				xls : 'file-icon-xls',
				xlsx: 'file-icon-xlsx',
				pdf : 'file-icon-pdf',
				txt : 'file-icon-txt',
				psd : 'file-icon-psd',
				jpg : 'file-icon-jpg',
				jpeg: 'file-icon-jpeg',
				png : 'file-icon-png',
				gif : 'file-icon-gif',
				bmp : 'file-icon-bmp',
				rmvb: 'file-icon-rmvb',
				mod : 'file-icon-mod',
				mov : 'file-icon-mov',
				'3gp': 'file-icon-3gp',
				avi : 'file-icon-avi',
				swf : 'file-icon-swf',
				flv : 'file-icon-flv',
				mpe : 'file-icon-mpe',
				asf : 'file-icon-asf',
				mmv : 'file-icon-wmv',
				mp4 : 'file-icon-mp4',
				wma : 'file-icon-wma',
				mp3 : 'file-icon-mp3',
				wav : 'file-icon-wav',
				fla : 'file-icon-fla',
				htm : 'file-icon-htm',
				html: 'file-icon-htm',
				chm : 'file-icon-chm',
				rar : 'file-icon-rar',
				zip : 'file-icon-zip',
				'custom/link' : 'file-icon-link',
				'custom/content' : 'file-icon-content',
				'custom/app' : 'file-icon-app',
				'custom/view' : 'file-icon-view'
			};
			var t = this.model.get('NODE_NAME').split('.');
			t = t[t.length-1].toLowerCase();
			this.$('.file-icon-small').addClass(file_types[t]);
			return this;
		},
		onClick:function(){
			window.location =
				GBROS.path + "/file?_node=" 
				+ this.model.get('NODE_KEY');
		}
	});
	
	var Slide = Backbone.View.extend({
		className:'preview-slide',
		events:{
			'click a':'onLink',
			'click area':'onArea'
		},
		initialize:function(){
			this.view = this.options.view;
			this.prevSlide = this.options.slide;
			this.catalogs = null;
			this.catalogModels = {};
			this.contents = null;
			this.contentViews = {};
			this.files = null;
			var b = {
				id:this.model.get('NODE_KEY'),
				name:this.model.get('NODE_NAME')
			};
			
			this.breadcrumbs = this.prevSlide
			? _.clone(this.prevSlide.breadcrumbs) : [];
			this.breadcrumbs.push(b);
			this.mapNodes = new Backbone.Collection([],{model:NodeModel});
		},
		renderBreadcrumb:function(model){
			var v= new PreviewBreadcrumb({model:model,slide:this});
			this.view.$('.J-breadcrumbs ul').append(v.render().el);
			return this;
		},
		renderCatalogMenu:function(model){
			var menu = new CatalogMenuItem({model:model,slide:this});
			this.$('.preview-catalog-menu ul').append(menu.render().el);
			return this;
		},
		renderContentMenu:function(model){
			var menu = new ContentMenuItem({model:model,slide:this});
			this.$('.preview-content-menu ul').append(menu.render().el);
			return this;
		},
		renderContent:function(node){
			node = node ? node : this.node;
			if(node.get('NODE_TYPE') === 'custom'){
				this.renderCustom(node);
			}else if(node.get('FILE_TYPE') && node.get('FILE_TYPE').indexOf('image') !== -1){
				this.renderImg(node);
			}else if(node.get('NODE_TYPE') === 'list'){
				this.renderFileList(node);
			}
			return this;
		},
		renderImg:function(node){
			var v = new PreviewContent;
			this.contentViews[node.get('NODE_KEY')]  = v;
			v.render().$('.preview-content').append('<img />');
			v.$('.preview-content img').attr('src',
				GBROS.path + '/file?_node='
				+ node.get('NODE_KEY')
				+ '&type=view'
			);
			this.$('.J-view-content-body').append(v.el);
			return this;
		},
		renderFileList:function(node){
			var v = new PreviewContent;
			var renderFile = function(node){
				var f = new FileItem({
					model:node
				});
				v.$('.content-body').append(f.render().el);
			};
			this.contentViews[node.get('NODE_KEY')]  = v;
			v.render().$('.preview-content')
			.attr('valign','top')
			.css('text-align','left')
			.append('<div class="content-disk"><ul class="content-body"></ul></div>');
			this.model.get('_files').each(renderFile,this);
			this.$('.J-view-content-body').append(v.el);
			return this;
		},
		renderCustom:function(node){
			node = node ? node : this.model;
			var model = new NodeModel;
			model.url = GBROS.path + '/file?_node='
			+ node.get('NODE_KEY')
			+ '&type=custom';
			var that = this;
			model.fetch({
				success:function(model,data){
					if(data.error){
						alert(data.error);
					}else if(data.unlogin){
						delete model;
						GBROS.logout();
					}else{
						var v = new PreviewContent;
						that.contentViews[node.get('NODE_KEY')]  = v;
						v.render().$('.preview-content').append(model.get('HTML_FRAGMENT'));
						if(node.get('FILE_TYPE') === 'custom/content'){
							v.$('.preview-content')
							.attr('align','left')
							.attr('valign','top');
						}
						that.$('.J-view-content-body').append(v.el);
						//uParse('.preview-content');
						that.mapNodes.add(_.pluck(model.get('VIEW_STRUCTURE').maps,'node'));
						that.view.setBodyHeight();
					}
				},
				error:function(model){
					if(confirm('访问服务器失败，是否重试?')){
						model.request();
					}
				}
			});
			return this;
		},
		renderMenu:function(node){
			this.$('.view-content-header').css('height','auto').show();
			//显示节点目录导航菜单
			if(node.get('_catalogs').length > 0){
				this.$('.J-view-content-body').css('margin-left',211);
				this.$('.preview-content-menu').css('margin-left',211);
				this.$('.preview-catalog-menu').show();
				this.$('.preview-catalog-menu ul').empty();
				//node.get('_catalogs').add(node,{at:0});
				node.get('_catalogs').each(this.renderCatalogMenu,this);
				//this.catalogs.at(0).set('_active',true);
				//this.renderContent(this.contents.at(0));
			}
			
			node.get('_contents').add({
				NODE_NAME:'文件列表',
				NODE_KEY:node.get('NODE_KEY') + '-list',
				NODE_TYPE:'list'
			});
			//显示节点内容导航菜单
			if(node.get('_contents').length > 0){
				this.$('.preview-content-menu ul').empty();
				node.get('_contents').each(this.renderContentMenu,this);
				node.get('_contents').at(0).set('_active',Math.floor(Math.random()*10+1));
			}
			
			if(node.get('_files').length > 0){
				var face = node.get('_files').find(function(model){
					return (
						model.get('FILE_TYPE') 
						&& model.get('FILE_TYPE').indexOf('image') !== -1
						&& model.get('NODE_NAME').indexOf('封面') !== -1
					);
				});
				
				if(face){
					this.$('.preview-catalog-menu .img').show().append('<img width="200" />');
					this.$('.preview-catalog-menu .img img').attr('src',
						GBROS.path + '/file?_node='
						+ face.get('NODE_KEY')
						+ '&type=view'
					);
				}
			}
			
			this.view.setBodyHeight();
		},
		renderCatalog:function(node){
			var model = new COMS.viewModel;
			model.url = this.view.mainView.model.url;
			model.filterModel.set({_node:node.get('NODE_KEY')},{silent: true});
			model.setCallBack($.proxy(function(){
				node.set('_catalogs',new Backbone.Collection(
					_.where(model.get('data').body,{NODE_TYPE:'catalog'}),
					{model:NodeModel}
				));
				
				node.set('_contents',new Backbone.Collection(
					_.where(model.get('data').body,{NODE_TYPE:'custom'})
					,{model:NodeModel}
				));
				
				node.set('_files',new Backbone.Collection(
					_.where(model.get('data').body,{NODE_TYPE:'file'})
					,{model:NodeModel}
				));
				this.renderMenu(node);
			},this));
			model.request();
			return this;
		},
		switchCatalog:function(model){
			
		},
		breadcrumb:function(){
			this.view.$('.J-breadcrumbs').empty().css('margin-top',20)
			.append('<ul class="fn-ul-iblock"><li><strong>预览导航</strong>：</li></ul>');
			for(var i = 0; i < this.breadcrumbs.length; i++){
				this.renderBreadcrumb(
					new Backbone.Model(this.breadcrumbs[i])
				);
			}
			return this;
		},
		render:function(){
			this.breadcrumb();
			this.$el.html($('#tpl-disk-preview-slide').html());
			if(this.model.get('NODE_TYPE') === 'catalog'){
				this.renderCatalog(this.model);
			}else{
				this.$('.view-content-header').remove();
				this.renderContent(this.model);
			}
			return this;
		},
		onLink:function(e){
			
		},
		onArea:function(e){
			var $el = $(e.target);
			var model = this.mapNodes.get($el.data('node'));
			if(this.model.get('_contents') && this.model.get('_contents').get(model.get('NODE_KEY'))){
				this.model.get('_contents').get(model.get('NODE_KEY')).set('_active',Math.floor(Math.random()*10+1));
			}else if(model.get('NODE_TYPE') === 'file' && model.get('FILE_TYPE').indexOf('image') === -1){
				window.location = GBROS.path + "/file?_node=" 
				+ model.get('NODE_KEY');
			}else{
				this.view.creatSlide(model,this);
			}
		},
		show:function(){
			this.view.showSlide(this);
			return this;
		}
	});
	
	//预览视图
	var Preview = Aid.extend({
		className:'disk-preview',
		template:_.template($('#tpl-disk-preview').html()),
		initialize:function(){
			Aid.prototype.initialize.apply(this, arguments);
			this.slides = {};
			this.currentSlide = null;
		},
		events:{
			'click .J-exit':'exit',
			'click .J-fullscreen':'fullScreen'
		},
		render:function(){
			this.$el.html(this.template());
			this.creatSlide(this.model);
			Aid.prototype.render.apply(this, arguments);
			return this;
		},
		setBodyHeight:function(){
			Aid.prototype.setBodyHeight.apply(this, arguments);
			this.$('.preview-catalog-menu ul').eq(0).height(
				this.$('.view-content-body').eq(0).height() + 40
				- this.$('.preview-catalog-menu .img').eq(0).outerHeight()
			);
			return this;
		},
		creatSlide:function(model,prevSlide){
			if(this.slides[model.get('NODE_KEY')]){
				this.showSlide(this.slides[model.get('NODE_KEY')]);
			}else{
				var slide = new Slide({
					model:model,
					view:this,
					slide:prevSlide,
					id:model.get('NODE_KEY')
				}).render();
				this.slides[model.get('NODE_KEY')] = slide;
				this.showSlide(slide);
			}
			return this;
		},
		showSlide:function(slide){
			if(this.currentSlide){
				this.currentSlide.$el.detach();
			}
			this.currentSlide = slide;
			this.$('.J-view-content').append(slide.breadcrumb().el);
			this.setBodyHeight();
			return this;
		},
		exit:function(){
			this.exitFullScreen();
			this.destroy();
			this.mainView.show();
			this.mainView.body.setHeadWidth();
			//delete this;
		},
		fullScreen:function(){
			$el = this.$('.J-fullscreen');
			if($el.hasClass('btn-success')){
				this.exitFullScreen();
			}else{
				$el.addClass('btn-success').removeClass('btn-default');
				$('#header').hide().height(0);
				$('#main').css('padding-top',0);
			}
			this.setBodyHeight();
		},
		exitFullScreen:function(){
			$el = this.$('.J-fullscreen');
			$el.removeClass('btn-success').addClass('btn-default');
			$('#header').show().height(50);
			$('#main').css('padding-top',50);
		}
	});
	
	var Minute = Aid.extend({
		template:_.template($('#tpl-view-minute').html()),
		initialize:function(options){
			Aid.prototype.initialize.apply(this, arguments);
			this.currentSlide = null;
		},
		events:{
			'click .J-exit':'exit'
		},
		render:function(){
			this.$el.html(this.template());
			Aid.prototype.render.apply(this, arguments);
			this.setBodyHeight();
			if(this.mainView.model.get('component').length > 0){
				this.tabs();
			}
			this.content = new compontent.DetailContent({
				model:this.model,
				view:this
			});
			this.$('.J-view-minute').html(this.content.render().el);
			this.setBodyHeight();
			return this;
		},
		tabs:function(){
			var tabs = new compontent.Tab({
				collection:new Backbone.Collection({id:'',name:'详细内容'}).add(this.mainView.model.get('component')),
				view:this
			});
			this.$('.J-tabs').html(tabs.render().el);
		},
		exit:function(e){
			this.destroy();
			this.mainView.show();
			this.mainView.body.setHeadWidth();
			e.stopPropagation();
			e.preventDefault();
		}
	});
	
	var Selector = Aid.extend({
		template:_.template($('#tpl-view-selector').html()),
		initialize:function(options){
			Aid.prototype.initialize.apply(this, arguments);
			this.url = this.options.url;
			this.callBack = this.options.callBack;
			this.list = this.options.list ? this.options.list : [];
			this.selectedList = null;
			this.selectView = null;
			this.listView = null;
		},
		events:{
			'click .J-cancel':'exit',
			'click .J-save':'commit',
			'click .tab-selector':'showSelector',
			'click .tab-list':'showList'
		},
		render:function(){
			this.$el.html(this.template());
			Aid.prototype.render.apply(this, arguments);
			this.createView();
			this.setBodyHeight();
			return this;
		},
		createView:function(){
			var model = new COMS.viewModel;
			var that = this;

			model.url = this.url;
			model.setCallBack(function(){
				that.selectView = new COMS.view.General({
					model:this,
					isNested:true,
					selector:that
				});
				that.selectedList = new that.selectView.Collection(that.list);
				that.count();
				model.view = that.selectView;
				that.selectView.render();
				that.selectView.$('.common-bar').hide();
				that.$('.J-view-selector').html(that.selectView.setBodyHeight().el);
				that.selectView.collection.on('change:_selected',that.selected,that);
			});
			model.request();
		},
		createList:function(){
			
		},
		selected:function(model){
			if(model.get('_selected')){
				this.selectedList.add(model);
			} else {
				this.selectedList.remove(model);
			}
			this.count();
		},
		count:function(){
			this.$('.tab-list span').text("(" + this.selectedList.length + ")");
		},
		showSelector:function(){
			
		},
		showList:function(){
			
		},
		commit:function(){
			this.callBack && this.callBack(this);
		},
		exit:function(e){
			this.destroy();
			this.mainView.show();
			this.mainView.body.setHeadWidth();
			e.stopPropagation();
			e.preventDefault();
		}
	});
	
	//普通视图定义
	var General =  Base.extend({
		contentType:'Table',
		template:_.template($('#tpl-view-list-layout').html()),
		initialize:function(){
			Base.prototype.initialize.apply(this, arguments);
			this.idName = this.model.get('attr').idName;
			this.Model = Backbone.Model.extend({idAttribute:this.idName});
			this.Collection = Backbone.Collection.extend({
			  model: this.Model
			});
			this.headCollection = new Backbone.Collection(this.model.get('attr').head);
			this.collection = new this.Collection;
			this.removeCollection = new Backbone.Collection;
			this.model.on('change',this.update,this);
			this.collection.on('change:_selected',this.selected,this);
			this.isNav = this.options.isNav;
			this.selector = this.options.selector;
			this.params = this.options.params;
		},
		events:{
			'click .J-view-content-header input':'allSelect',
			'change .view-search-box input':'onSearch'
		},
		render:function(){
			if(this.isNav && $('#J-view').data('id') !== this.model.get('_resId')){
				this.destroy();
				return;
			}else if(this.isNav){
				$('#J-view').empty().addClass('loading');
			}
			
			$('#J-view').removeClass('loading').append(this.el);
			this.$el.append(this.template());
			
			//载入视图组件
			//Action
			this.action();
			
			//Filter
			this.filter();
			
			//Breadcrumb
			this.breadcrumb();
			
			if(this.model.get('type') === 'disk'){
				this.search();
			}

			//Content
			this.update();
      this.setBodyHeight();
			return this;	
		},
		//面包屑渲染
		breadcrumb:function(){
			var v = new compontent.Breadcrumb({
				collection:new Backbone.Collection(this.model.get('breadcrumb')),
				view:this
			});
			this.$('.J-view-breadcrumb').html(v.render().el);
		},
		//节点分页面包屑导航
		nodeBreadcrumb:function(){
			this.$('.J-view-breadcrumb').hide();
			var parents = _.clone(this.model.get('data').node.parents);
			parents.push({id:this.model.get('data').node.id,name:this.model.get('data').node.name});
			var v = new compontent.Breadcrumb({
				collection:new Backbone.Collection(parents),
				view:this,
				tpl:'<a href="#!' 
				+ this.getHash()
				+ '/_node=<%=id%>'
				+'"><%=name%></a>'
			});
			parents.length > 0 && this.$('.J-view-node-breadcrumb').html(v.render().el);
		},
		//节点分页导航
		nodeNav:function(node){
			this.$('.view-search-box input').val('');
			this.model.filterModel.unset('_search',{silent:true});
			this.model.filterModel.set('_node',node);
			GBROS.stopRouter = true;
			window.location.hash = '#!' + this.getHash()
			+ '/_node=' +  node;
		},
		//操作按钮渲染
		action:function(){
			var v = new compontent.Action({
				collection:new Backbone.Collection(this.model.get('action')),
				view:this
			});
			this.$('.J-view-action').html(v.render().el);
		},
		//过滤器渲染
		filter:function(){
			var filters = new Backbone.Collection(this.model.get('attr').filter);
			var v = new compontent.Filter({
				collection:new Backbone.Collection(filters.where({type:'where'})),
				view:this
			});
			this.$('.J-view-filter').html(v.render().el);
		},
		setting:function(){
			
		},
		//分页渲染
		pagination:function(){
			if(this.model.get('mode') === 'list' 
			&& this.model.get('param').pagination === 'size'){
				if(this.model.filterModel && !this.model.filterModel.get('_page')){
					this.model.filterModel.set({_page:1},{silent: true});	
				}
				var v = new compontent.Pagination({
					model:new Backbone.Model(this.model.get('data').page),
					view:this
				});
				this.$('.J-view-pagination').html(v.render().el);
			}
		},
		//内容渲染
		content:function(){
			if(this.model.get('type') === 'disk'){
				this.contentType = 'Disk';
			}
			this.body = new compontent[this.contentType]({
				collection:this.collection,
				view:this
			});
			this.$('.J-view-content-body').html(this.body.render().el);
			if(this.body.copyHead){
				this.setBodyHeight();
				var head = this.body.copyHead();
				this.$('.J-view-content-header').html(head.el);
			}
		},
		//搜索框
		search:function(){
			this.$('.view-search-box').append(
				'<div class="input-append">' +
				'<input class="span3" type="text" placeholder="文件或目录名称"> ' +
				'<button class="btn btn-default" type="button">' +
				'<i class="icon-search"></i> 搜索 </button></div>'
			);
			return this;
		},
		//设置数据集合
		setCollection:function(){
			this.collection.reset();
			this.collection.set(this.model.get('data').body);
		},
		//行统计
		rowCount:function(){
			if(this.model.get('data').page){
				this.$('.J-row-count').show().find('strong').html(this.model.get('data').page.count);
			}
			this.$('.J-current-count strong').html(this.collection.length);
			this.$('.J-row-selected-count strong').html(this.collection.where({_selected:true}).length);
		},
		//视图模型更新处理
		update:function(){
			if(this.model.get('mode') === 'list' 
			&& this.model.get('param').pagination === 'node'
			&& this.model.get('data').node){
				this.nodeBreadcrumb();
			}
			this.pagination();
			this.setCollection();
			this.content();
			this.selector && this.autoSelected();
			this.rowCount();
			this.setBodyHeight();
		},
		autoSelected:function(){
			this.collection.each(function(model){
				this.selector.selectedList
				&& this.selector.selectedList.get(model.id)
				&& model.set('_selected',true);
			},this);
		},
		//行选定事件处理
		selected:function(){
			this.rowCount();
			if(this.collection.where({_selected:true}).length === this.collection.length){
				this.$('.J-view-content-header input[type=checkbox]').attr('checked',true);
			}else{
				this.$('.J-view-content-header input[type=checkbox]').removeAttr('checked');
			}
		},
		allSelect:function(e){
			var $el = $(e.target);
			var s;
			if($el.attr('checked')){
				s = {_selected:true};
			}else{
				s = {_selected:false};
			}
			
			this.collection.each(function(model){
				model.set(s);
			},this);
		},
		onSearch:function(e){
			var s = encodeURIComponent(this.$('.view-search-box input').val());
			if(!s && !this.model.filterModel.get('_search')){
				return;
			}
			this.model.filterModel.set('_search',s);
			var hash = '#!' + this.getHash();
			if(this.model.filterModel.get('_node')){
				hash += '/_node=' +  this.model.filterModel.get('_node');
			}
			hash += '/_search=' + s;
			GBROS.stopRouter = true;
			window.location.hash = hash;
		},
		getHash:function(){
			var hash = '';
			if(this.model.get('breadcrumb')){
				hash = _.pluck(this.model.get('breadcrumb'),'id').join('/');
			}
			return hash;
		}
	});
	
	//表格视图定义（自适应宽度）
	var Table = General.extend({
		
	});
	
	//网格视图定义（固定宽度）
	var Grid = General.extend({
		
	});
	
	//管理视图定义
	var Handle = General.extend({
		className:'view-container'
	});
	
	//编辑器视图定义
	var Editor = General.extend({
		contentType:'EditTable',
		className:'view-container editor-sheet',
		template:_.template($('#tpl-view-sheet-layout').html()),
		initialize:function(){
			General.prototype.initialize.apply(this, arguments);
			this.hasEdit = (this.options.hasEdit === false) ? false : true;
			this.hasCreat = (this.options.hasCreat === false) ? false : true; 
			this.hasRemove = (this.options.hasRemove === false) ? false : true;
			this.rowNum = this.options.rowNum ? this.options.rowNum : 10;
			this.mainView = this.options.main;
			this.mainAction = this.options.action;
			var editor = COMS.editor;
			editor.view = view;
			this.editor = new editor.Sheet({view:this});
		},
		render:function(){
			this.mainView.hide();
			General.prototype.render.apply(this, arguments);
			this.$('.J-view-content-body').append(this.editor.render().el);
			return this;
		}
	});
	
	var view = {
		Simple:Simple,
		Aid:Aid,
		Iframe:Iframe,
		General:General,
		Table:Table,
		Grid:Grid,
		Editor:Editor,
		Preview:Preview,
		Minute:Minute,
		Selector:Selector
	};

	return view;
});