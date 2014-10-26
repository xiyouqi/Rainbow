define(function(require){
	var formUI = COMS.formUI;
	var view = COMS.view;
	var utils = {
		foreach : function(arr, func) {
			for(var i = 0, count = arr.length; i < count; i++) {
				func(arr[i], i);
			}
		},
		addClass : function(node, str) {
			var is_svg = node.className.baseVal !== undefined ? true : false,
				arr = is_svg ? node.className.baseVal.split(' ') : node.className.split(' '),
				isset = false;
			
			utils.foreach(arr, function(x) {
				if(x === str) {
					isset = true;
				}
			});
			
			if (!isset) {
				arr.push(str);
				is_svg ? node.className.baseVal = arr.join(' ') : node.className = arr.join(' ');
			}
			
			return this;
		},
		removeClass : function(node, str) {
			var is_svg = node.className.baseVal !== undefined ? true : false,
				arr = is_svg ? node.className.baseVal.split(' ') : node.className.split(' '),
				isset = false;
			
			utils.foreach(arr, function(x, i) {
				if(x === str) {
					isset = true;
					arr.splice(i--, 1);
				}
			});
			
			if (isset) {
				is_svg ? node.className.baseVal = arr.join(' ') : node.className = arr.join(' ');
			}
			
			return this;
		},
		hasClass : function(node, str) {
			var is_svg = node.className.baseVal !== undefined ? true : false,
				arr = is_svg ? node.className.baseVal.split(' ') : node.className.split(' '),
				isset = false;
				
			utils.foreach(arr, function(x) {
				if(x === str) {
					isset = true;
				}
			});
			
			return isset;
		}
	};
	
	//辅助编辑
	var Helper = Backbone.View.extend({
		events:{
			
		},
		initialize:function(){
			
		}
	});
	
	//形状定义
	var Shape = Backbone.View.extend({
		initialize:function(){
			if(!this.model.get('param')){
				this.param = {type:this.options.type};
			}else{
				this.param = _.clone(this.model.get('param'));
			}
			this.shape = document.createElementNS('http://www.w3.org/2000/svg', this.param.type);
			this.$shape = $(this.shape);
			this.canvas = this.options.canvas;
			this.g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
			this.$g = $(this.g);
			this.origin = {x:0,y:0};
			this.$g.append(this.shape);
			this.closed = false;
			utils.addClass(this.shape,'shape selected');
			this.$shape.on('mousedown',$.proxy(this.onMouseDown,this));
			this.$shape.on('dblclick',$.proxy(this.onClick,this));
			this.moveParam = {};
			
			if(this.model.get('param')){
				this.render().draw();
			}
		},
		changeMode:function(){
			if(this.canvas.model.get('mode') === 'edit'){
				this.$shape.on('click',$.proxy(this,'onClick'));
			}else{
				this.$shape.off('click',$.proxy(this,'onClick'));
			}
		},
		onMouseDown:function(e){
			if(this.canvas.model.get('mode') === 'edit' & e.button === 0){
				this.canvas.model.set('mode','moving');
				this.canvas.changeCurrent(this);
				this.moveParam = {x:e.pageX,y:e.pageY};
				e.preventDefault();
			}
		},
		onMouseMove:function(e,up){
			if(this.canvas.model.get('mode') === 'moving'){
				var offset = {};
				offset.x = e.pageX - this.moveParam.x;
				offset.y = e.pageY - this.moveParam.y;
				this.moveParam = {x:e.pageX,y:e.pageY};
				this.onMove(offset);
			}
		},
		onMove:function(offset,up){
			if(up){this.moveParam = {};}
			this.origin.x += offset.x;
			this.origin.y += offset.y;
			this.move(offset);
			return this;
		},
		onClick:function(e){
			var form = COMS.viewForm;
			var tree = COMS.tree;
			var action = new Backbone.View({
				model:new Backbone.Model({
					name:'设置导航链接',
					desc:''
				})
			});
			
			var t = new tree.Base({
				url:this.canvas.action.view.model.url,
				isNode:{name:'NODE_TYPE',value:'catalog',result:false}
			});
			
			var f = new form.Form({
				model:new Backbone.Model,
				action:action,
				modal:true,
				callBack:$.proxy(function(data,form){
					if(t.selectedColl.length){
						this.setMap(t.selectedColl.at(0),form);
					}else{
						alert('请选择导航的节点');
						f.enableSubmit();
					}
				},this),
				attributes:{
					tabindex:"-1",
					role:"dialog",
					"aria-labelledby":"myModalLabel",
					"aria-hidden":"true"	
				}
			});
			
			//渲染、Class附加、开启模式窗口
			f.render().$el.addClass('modal hide fade').modal({
				keyboard: false
			});
	
			
			f.$('.modal-body').append(t.render().el).height(250);
			
			//模式窗口关闭
			f.$el.on('hidden', function () {
				f.destroy();
				delete f;
			});
		},
		setMap:function(data,form){
			this.model.set('node_key',data.get('NODE_KEY'));
			this.model.set('node_name',data.get('NODE_NAME'));
			this.model.set('node',data.toJSON());
			this.draw();
			form.$el.modal('hide');
		},
		render:function(offset){
			offset && this.onDraw(offset);
			this.canvas.$svg.append(this.g);
			return this;
		},
		setParam:function(name,value){
			this.param[name] = value;
			return this;
		},
		closeDraw:function(){
			this.closed = true;
			this.model.set('param',this.param);
			this.canvas.model.set('mode','draw');
		},
		next:function(offset){
			this.cumpute(offset).draw();
			this.closeDraw();
			return this;
		},
		moveDraw:function(offset){
			this.cumpute(offset).draw();
			return this;
		},
		selected:function(){
			if(utils.hasClass(this.shape,'selected')){
				utils.removeClass(this.shape,'selected');
			}else{
				utils.addClass(this.shape,'selected');
			}
		},
		unSelected:function(){
			
		},
		destroy:function(){
			this.canvas.maps.remove(this.model);
			this.$g.remove();
			this.remove();
			delete this;
		}
	});
	
	var area = {
		rect:Shape.extend({
			onDraw:function(offset){
				this.$shape.attr('x',offset.x);
				this.$shape.attr('y',offset.y);
				this.origin.x = offset.x;
				this.origin.y = offset.y;
				return this;
			},
			cumpute:function(offset){
				this.param.x = offset.x < this.origin.x ? offset.x : this.origin.x;
				this.param.y = offset.y < this.origin.y ? offset.y : this.origin.y;
				this.param.width = Math.abs(offset.x - this.origin.x);
				this.param.height = Math.abs(offset.y - this.origin.y);
				return this;
			},
			draw:function(){
				this.$shape
				.attr('x',this.param.x)
				.attr('y',this.param.y)
				.attr('width',this.param.width)
				.attr('height',this.param.height);
				this.model.set('html',this.toHtml());
				return this;
			},
			move:function(offset){
				this.param.x += offset.x;
				this.param.y += offset.y;
				this.draw();
				return this;
			},
			toHtml:function(){
				return '<area shape="rect" coords="'
				+ this.param.x + ', '
				+ this.param.y + ', '
				+ (this.param.x + this.param.width) + ', '
				+ (this.param.y + this.param.height)
				+ '" href="javascript:void(0);"'
				+ (this.model.get('node_key') ? ' data-node="' + this.model.get('node_key') + '"' : '')
				+ (this.model.get('node_name') ? ' alt="' + this.model.get('node_name') + '"' : '')
				+ (this.model.get('node_name') ? ' title="' + this.model.get('node_name') + '"' : '')
				+ ' />';
			}
		}),
		circle:Shape.extend({
			onDraw:function(offset){
				this.$shape.attr('cx',offset.x);
				this.$shape.attr('cy',offset.y);
				this.origin.x = offset.x;
				this.origin.y = offset.y;
				this.param.cx = this.origin.x;
				this.param.cy = this.origin.y;
				return this;
			},
			cumpute:function(offset){
				var w = Math.abs(offset.x - this.origin.x);
				var h = Math.abs(offset.y - this.origin.y);
				this.param.r = Math.round(Math.sqrt(w*w+h*h));
				return this;
			},
			draw:function(){
				this.$shape
				.attr('cx',this.param.cx)
				.attr('cy',this.param.cy)
				.attr('r',this.param.r);
				this.model.set('html',this.toHtml());
				return this;
			},
			move:function(offset){
				this.param.cx += offset.x;
				this.param.cy += offset.y;
				this.draw();
				return this;
			},
			toHtml:function(){
				return '<area shape="circle" coords="'
				+ this.param.cx + ', '
				+ this.param.cy + ', '
				+ this.param.r
				+ '" href="javascript:void(0);"'
				+ (this.model.get('node_key') ? ' data-node="' + this.model.get('node_key') + '"' : '')				
				+ (this.model.get('node_name') ? ' alt="' + this.model.get('node_name') + '"' : '')
				+ (this.model.get('node_name') ? ' title="' + this.model.get('node_name') + '"' : '')
				+ ' />';
			}
		}),
		polygon:Shape.extend({
			inDraw:false,
			onDraw:function(offset){
				this.$shape.attr('points',offset.x + ' ' + offset.y);
				this.origin.x = offset.x;
				this.origin.y = offset.y;
				this.param.points = [offset.x,offset.y];
				return this;
			},
			next:function(offset){
				this.param.points.push(offset.x,offset.y);
				this.draw();
				if(this.inDraw){
					this.closeDraw();
				}
				this.inDraw = true;
				var _this = this;
				setTimeout(function(){
					_this.inDraw = false;
				},300);
				return this;
			},
			moveDraw:function(offset){
				this.$shape
				.attr('points',this.param.points.join(' ') + ' ' + offset.x + ' ' + offset.y);
				return this;
			},
			draw:function(){
				this.$shape
				.attr('points',this.param.points.join(' '));
				this.model.set('html',this.toHtml());
				return this;
			},
			move:function(offset){
				this.param.points = _.map(this.param.points,function(point,i){
					if(i % 2 === 0){
						return point + offset.x;
					}else{
						return point + offset.y;
					}
				});
				this.draw();
				return this;
			},
			toHtml:function(){
				return '<area shape="poly" coords="'
				+ this.param.points.join(',')
				+ '" href="javascript:void(0);"'
				+ (this.model.get('node_key') ? ' data-node="' + this.model.get('node_key') + '"' : '')
				+ (this.alt ? ' alt="' + this.alt + '"' : '')
				+ (this.title ? ' title="' + this.title + '"' : '')
				+ ' />';
			}
		})
	};
	
	//自定义视图编辑器
	var CustomView = view.Aid.extend({
		className:'editor-custom-view-canvas',
		template:_.template($('#tpl-view-custom-view').html()),
		events:{
			'click .J-save':'save',
			'click .J-cancel':'cancel',
			'click svg':'onClick',
			'mousemove svg':'onMouseMove',
			'mousedown svg':'onMouseDown',
			'mouseup svg':'onMouseUp',
			'click .J-draw:not(.disabled)':'onSelectDraw',
			'click .dropzone':'selectImage'
		},
		initialize:function(){
			this.action = this.options.action;
			this.mainView = this.action.view;
			//Map集合
			this.maps = new Backbone.Collection;
			this.img = new Image;
			this.$img = $(this.img);
			this.$svg = $('<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny" id="svg"></svg>');
			this.$svg.css({
				position:'absolute',
				top:0,
				left:0
			});
			
			if(this.model){
				var url = GBROS.path + '/file?_node='
				+ this.model.get('NODE_KEY') + '&type=custom';
				$.ajax(
					url,{
						async:false,
						dataType:'json',
						error:function(){
							alert('服务器请求失败请刷新页面重试');
						},
						success:function(data, textStatus, jqXHR){
							if(data.error){
								alert(data.error);
							}else if(data.unlogin){
								GBROS.logout();
							}else{
								this.values = data;
							}
						},
						context:this
					}
				);
			}else{
				this.model = new Backbone.Model;
			}
			
			this.model.set({
				//模式  edit | editing | draw | drawing | drew
				mode: null,
				//绘画类型  rect | circle | polygon
				drawType:null
			});
			
			this.currentArea = null;
			$(document).on('keydown',$.proxy(this.onKeyDownEvent,this));
		},
		getOffset:function(e){
			return {
				x:Math.round(e.pageX - this.$svg.offset().left),
				y:Math.round(e.pageY - this.$svg.offset().top)
			};
		},
		changeCurrent:function(area){
			if(this.currentArea){
				utils.removeClass(this.currentArea.shape,'selected');
			}
			this.currentArea = area;
			utils.addClass(this.currentArea.shape,'selected');
		},
		onMouseMove:function(e){
			if(this.model.get('mode') === 'drawing'){
				this.currentArea.moveDraw(this.getOffset(e));
			}else if(this.model.get('mode') === 'moving'){
				this.currentArea.onMouseMove(e);
			}
		},
		onMouseUp:function(e){
			if(this.model.get('mode') === 'moving'){
				this.currentArea.onMouseMove(e,true);
				this.model.set('mode','edit');
				e.preventDefault();
			}
		},
		onSelectDraw:function(e){
			if(this.model.get('mode') === 'drawing'){
				return true;
			}
			var $el = $(e.currentTarget);
			if($el.hasClass('btn-success')){
				$el.removeClass('btn-success').addClass('btn-default');
				this.model.set('drawType',null);
				this.$svg.css({cursor:'default'});
				this.setEditMode();
			}else{
				$el.siblings().removeClass('btn-success').addClass('btn-default');
				$el.removeClass('btn-default').addClass('btn-success');
				this.model.set('drawType',$el.data('type'));
				this.$svg.css({cursor:'crosshair'});
				this.setDrawMode();
			}
		},
		onClick:function(e){
			if(this.model.get('mode') === 'draw'){
				this.creatArea(this.getOffset(e));
			}else if(this.model.get('mode') === 'drawing'){
				this.currentArea.next(this.getOffset(e));
				e.stopPropagation();
				e.preventDefault();
			}
		},
		onKeyDownEvent:function(e){
			//编辑状态下移动和删除面积
			if(this.model.get('mode') === 'edit'){
				//left
				if(e.keyCode === 37){
					this.currentArea.origin.x < 1 
					|| this.currentArea.onMove({x:-1,y:0});
				//top	
				}else if(e.keyCode === 38){
					this.currentArea.origin.y < 1 
					|| this.currentArea.onMove({x:0,y:-1});;
				//right
				}else if(e.keyCode === 39){
					this.currentArea.origin.x + this.currentArea.param.width > this.img.width - 1
					|| this.currentArea.onMove({x:1,y:0});
				//bottom	
				}else if(e.keyCode === 40){
					this.currentArea.origin.y + this.currentArea.param.height > this.img.height - 1
					|| this.currentArea.onMove({x:0,y:1});
				//delete
				}else if(e.keyCode === 46){
					this.currentArea.destroy();
				}
			}
			
			//Drawing状态下关闭绘画
			if(this.model.get('mode') === 'drawing'
			&& this.currentArea.type === 'polygon'
			&& e.keyCode === 13
			&& !this.currentArea.closed){
				this.currentArea.draw().closeDraw();
			}
		},
		creatArea:function(offset,model){
			var type = model ? model.get('param').type : this.model.get('drawType');
			this.model.set('mode','drawing');
			model = model ? model : new Backbone.Model;
			this.maps.add(model);
			var a = new area[type]({
				model:model,
				canvas:this,
				type:type
			}).render(offset);
			this.changeCurrent(a);
		},
		render:function(){
			this.$el.html(this.template());
			this.$('.J-tool-bar').html($('#tpl-view-custom-action').html());
			this.$('.J-title-bar').html($('#tpl-view-content-title').html());
			this.$('.J-view-content-body')
			.append($('#tpl-view-custom-canvas').html());
			view.Aid.prototype.render.apply(this, arguments);
			this.$canvas = this.$('.canvas-container');
			this.setImage();
			if(this.values){
				this.loadImage(this.values.VIEW_STRUCTURE.img);
				this.$('input').val(this.values.VIEW_NAME);
				_.each(this.values.VIEW_STRUCTURE.maps,function(map){
					this.creatArea(null,new Backbone.Model(map));
				},this);
			}
			return this;
		},
		setImage:function(){
			function testFile(type) {
				switch (type) {
				case 'image/jpeg':
				case 'image/gif':
				case 'image/png':
					return true;
					break;
				}
				return false;
			}
			this.$canvas.append(this.img);
			var $dropzone = this.$('.dropzone');
			var dropzone = $dropzone.get(0);
			var _this = this;
			dropzone.addEventListener('dragover', function(e){
				e.stopPropagation();
				e.preventDefault();
			}, false);
			
			dropzone.addEventListener('dragleave', function(e){
				e.stopPropagation();
				e.preventDefault();
			}, false);

			dropzone.addEventListener('drop', function(e){
				e.stopPropagation();
				e.preventDefault();
				var reader = new FileReader(),
					file = e.dataTransfer.files[0];
				
				if (testFile(file.type)) {
					
					reader.readAsDataURL(file);
					reader.onload = function(e) {
						_this.loadImage(e.target.result);
					};
				} else {
					alert('只支持图片拖拽');
				}

			}, false);
		},
		selectImage:function(e){
			var form = COMS.viewForm;
			var tree = COMS.tree;
			var action = new Backbone.View({
				model:new Backbone.Model({
					name:'选择图片',
					desc:''
				})
			});
			
			var t = new tree.Base({
				url:this.action.view.model.url,
				isNode:{name:'NODE_TYPE',value:'catalog',result:false}
			});
			
			var f = new form.Form({
				model:new Backbone.Model,
				action:action,
				modal:true,
				callBack:$.proxy(function(data,form){
					if(t.selectedColl.length){
						var node = t.selectedColl.at(0);
						if(node.get('FILE_TYPE') && node.get('FILE_TYPE').indexOf('image') !== -1){
							this.loadImage(
								GBROS.path + '/file?_node='
								+ node.get('NODE_KEY')
								+ '&type=view'
							);
							form.$el.modal('hide');
						}else{
							alert('只能选择载入图片(PNG/GIF/JPG)文件');
							f.enableSubmit();
						}
					}else{
						alert('请选择导航的节点');
						f.enableSubmit();
					}
				},this),
				attributes:{
					tabindex:"-1",
					role:"dialog",
					"aria-labelledby":"myModalLabel",
					"aria-hidden":"true"	
				}
			});
			
			//渲染、Class附加、开启模式窗口
			f.render().$el.addClass('modal hide fade').modal({
				keyboard: false
			});
	
			
			f.$('.modal-body').append(t.render().el).height(250);
			
			//模式窗口关闭
			f.$el.on('hidden', function () {
				f.destroy();
				delete f;
			});
			
			
		},
		loadImage:function(src){
			this.img.src = src;
			this.$('.read-image').hide();
			this.img.onload = $.proxy(function() {
				this.img.style.display = 'inline-block';
				this.$canvas.width(this.img.width);
				this.$svg.width(this.img.width).height(this.img.height);
				this.$img.width(this.img.width).height(this.img.height);
				this.showCanvas();
			},this);
		},
		//显示画布
		showCanvas:function(){
			this.$canvas.show();
			this.$canvas.append(this.$svg);
			this.$('button').removeClass('disabled');
			this.setEditMode();
		},
		//清空画布
		cleanCanvas:function(){
			
		},
		//设置绘画类型
		setDrawMode:function(e){
			this.model.set('mode','draw');
			utils.removeClass(this.$svg.get(0),'edit');
			utils.addClass(this.$svg.get(0),'draw');
		},
		//设置编辑模式
		setEditMode:function(){
			this.model.set('mode','edit');
			utils.removeClass(this.$svg.get(0),'draw');
			utils.addClass(this.$svg.get(0),'edit');
		},
		toHtml:function(){
			//var html = '<img src="' + this.img.src + '" usemap="#' + new Date().getTime() + '" />';
			var time = new Date().getTime();
			this.$img.attr('usemap','#' + time);
			var html = this.img.outerHTML;
			html += '<map name="' + time + '">';
			this.maps.each(function(model){
				html += model.get('html');
			});
			html += '</map>';
			return html;
		},
		//取消编辑模式
		unsetEditMode:function(){
			this.model.set('mode',null);
			this.$canvas.hide();
		},
		save:function(e){
			
			if(!this.$('input').val()){
				alert('标题不能为空');
				return;
			}
			
			var data = {
				PARENT_KEY:this.action.view.model.get('data').node.id,
				VIEW_TITLE:this.$('input').val(),
				VIEW_NAME:this.$('input').val(),
				VIEW_STRUCTURE:{img:this.$img.attr('src'),maps:this.maps.toJSON()},
				HTML_FRAGMENT:this.toHtml()
			};
			
			if(this.model.get('NODE_KEY')){
				data.NODE_KEY = this.model.get('NODE_KEY');
			}
			
			data = {_data:JSON.stringify(data)};
			
			var $e = $(e.target);
			$.ajax(GBROS.actionPath + this.action.model.get('id'),{
				type:'post',
				context:this,
				data:data,
				dataType:'json',
				success:function(data,textStatus,jqXHR){
					if(data.error){
						alert(data.error);
						$e.removeClass('disabled');
					}else if(data.unlogin){
						$e.removeClass('disabled');
						GBROS.logout();
					}else if(data.ok){
						alert(data.ok);
						this.mainView.model.request();
						this.mainView.show();
						this.destroy();
						if(this.options.modal) {
							this.$el.modal('hide');
						}
					}else{
						alert('服务器异常：'+data);
						$e.removeClass('disabled');
					}
				},
				error:function(){
					$e.removeClass('disabled');
					if(confirm('访问服务器失败，是否重试?')){
						this.save();
					}
				}
			});
		},
		cancel:function(e){
			$(document).off('keydown',$.proxy(this.onKeyDownEvent,this));
			this.destroy();
			this.mainView.show();
			this.mainView.body.setHeadWidth();
			delete this;
		}
	});
	
	//内容视图编辑器
	var Content = view.Aid.extend({
		className:'editor-custom-view',
		template:_.template($('#tpl-view-custom-view').html()),
		events:{
			'click .J-save':'save',
			'click .J-cancel':'cancel'
		},
		initialize:function(){
			this.action = this.options.action;
			this.mainView = this.action.view;
			this.editor = null;
			if(this.model){
				var url = GBROS.path + '/file?_node='
				+ this.model.get('NODE_KEY') + '&type=custom';
				$.ajax(
					url,{
						async:false,
						dataType:'json',
						error:function(){
							alert('服务器请求失败请刷新页面重试');
						},
						success:function(data, textStatus, jqXHR){
							if(data.error){
								alert(data.error);
							}else if(data.unlogin){
								GBROS.logout();
							}else{
								this.values = data;
							}
						},
						context:this
					}
				);
			}
		},
		render:function(){
			this.$el.html(this.template());
			this.$('.J-view-content-body').css('padding','0')
			.append('<textarea id="__content-editor" style="width:100%;display:none;"></textarea>');
			this.$('.J-tool-bar').html($('#tpl-view-content-title').html());
			//var $content = $('<script id="__container" name="content" type="text/plain"></script>');
			if(this.values){
				this.$('input').val(this.values.VIEW_NAME);
				this.$('textarea').val(this.values.HTML_FRAGMENT);
				//$content.html(this.values.HTML_FRAGMENT);
			}
			view.Aid.prototype.render.apply(this, arguments);
			this.editor = KindEditor.create(
				'#__content-editor',
				{
					//autoHeightMode:true
					height:this.$('.J-view-content-body').height() - 3,
			  	allowUpload:false
			  }
			);
			setTimeout($.proxy(this.setHeight,this),50);
			/*
			this.$('.J-view-content-body').append($content);
			this.editor = UE.getEditor('__container',{
			    initialFrameHeight:this.$('.J-view-content-body').height() - 105,
			    autoHeightEnabled:false
			});
			*/
			$(window).on('resize',$.proxy(this,'setHeight'));
			
			return this;
		},
		setHeight:function(){
			this.$('.ke-edit').height(this.$('.J-view-content-body').height()-65);
			this.$('.ke-edit-iframe').height(this.$('.J-view-content-body').height()-65);
			//this.editor.setHeight(this.$('.J-view-content-body').height() - 105);
		},
		save:function(e){
			this.editor.sync();
			if(!this.$('input').val()){
				alert('标题不能为空');
				return;
			}
			var data = {
				PARENT_KEY:this.action.view.model.get('data').node.id,
				VIEW_TITLE:this.$('input').val(),
				VIEW_NAME:this.$('input').val(),
				//HTML_FRAGMENT:this.editor.getContent()
				HTML_FRAGMENT:this.$('#__content-editor').val()
			};
			
			if(this.model){
				data.NODE_KEY = this.model.get('NODE_KEY');
			}
			
			data = {_data:JSON.stringify(data)};

			var $e = $(e.target);
			$.ajax(GBROS.actionPath + this.action.model.get('id'),{
				type:'post',
				context:this,
				data:data,
				dataType:'json',
				success:function(data,textStatus,jqXHR){
					if(data.error){
						alert(data.error);
						$e.removeClass('disabled');
					}else if(data.unlogin){
						$e.removeClass('disabled');
						GBROS.logout();
					}else if(data.ok){
						alert(data.ok);
						this.mainView.model.request();
						this.mainView.show();
						this.destroy();
						if(this.options.modal) {
							this.$el.modal('hide');
						}
					}else{
						alert('服务器异常：'+data);
						$e.removeClass('disabled');
					}
				},
				error:function(){
					$e.removeClass('disabled');
					if(confirm('访问服务器失败，是否重试?')){
						this.save();
					}
				}
			});
		},
		destroy:function(){
			//this.editor.destroy();
			view.Aid.prototype.destroy.apply(this, arguments);
		},
		cancel:function(e){
			
			$(window).off('resize',$.proxy(this,'setHeight'));
			this.mainView.show();
			this.mainView.body.setHeadWidth();
			this.destroy();
		}
	});
	
	//数据表格编辑器
	var Sheet = Backbone.View.extend({
		tagName:'div',
		className:'editor-tool-box',
		events:{
			
		},
		initialize:function(){
			this.view = this.options.view;
			this.isCopy = false; //粘贴模式
			this.isInput = false; //输入模式
			this.clickIn = false; //已点击模式
			this.clickNum = 0; //连击次数
			this.isKeyEvent = false; //键盘事件
			this.isInputContent = true;
			this.w;
			this.h;
			this.currentCell;
			this.$currentCell;
		},
		render:function(){
			$(document).unbind('click',$.proxy(this,'selectBlurEvent'));
			this.$input = $('<textarea class="input-box" style="height: 0px; width: 0px;"></textarea>');
			this.$inputBox = $('<div class="input-p"></div>').append(this.$input);
			this.$selectBox = $('<div class="select-box"><em></em></div>');
			this.$selectPoint = $('<div class="point"></div>');
			this.$el.append(this.$selectBox).append(this.$inputBox).append(this.$selectPoint);
			this.$selectBox.on('click',$.proxy(this,'onDblClickEvent'));
			return this;	
		},
		onCell:function(e,cell){
			this.currentCell = cell;
			this.$currentCell = cell.$el;
			this.selectedCell();
			this.onKeyDown();
			this.$input.unbind('blur',$.proxy(this,'inputBlurEvent'));
			$(document).click($.proxy(this,'selectBlurEvent'));
			this.$input.val('');
			//this.clickIn = true;
		},
		//选定单元格
		selectedCell:function(){
			this.setCellPosition();
			this.$selectBox.show();
			this.$inputBox.show();
			this.$selectPoint.show();
			this.isInputContent = true;
			this.$selectBox.empty();
			this.$selectBox.removeClass('select dropdown open');
			if(this.currentCell.head.get('form') === 'select' || this.currentCell.head.get('form') === 'chosen'){
				this.$selectBox.addClass('select dropdown');
				this.isInputContent = false;
				this.showSelectList();
			}else if(this.currentCell.head.get('metaType') === 'bool'){
				this.isInputContent = false;
			}
			var that = this;
			setTimeout(function(){
				that.$input.focus();
			},100);
		},
		//取消选定
		concelSelected:function(){
			this.unKeyDown();
			this.$input.unbind('blur',$.proxy(this,'inputBlurEvent'));
			$(document).unbind('click',$.proxy(this,'selectBlurEvent'));
			this.$selectBox.hide();
			this.$inputBox.hide();
			this.$selectPoint.hide();
			this.clickIn = false;
		},
		//显示输入框
		showInput:function(onKey){
			this.$inputBox.height('auto').width('auto').css('overflow','visible').show();
			this.$input.height(this.h).width(this.w).focus();
			this.isInput = true;
			this.$input.on('blur',$.proxy(this,'inputBlurEvent'));
			
			//非键盘事件状态下更新输入框的值
			if(!onKey){
				var value = this.currentCell.model.get('name');
				value = value === null ? '' : value;
				this.$input.val(value);
			}
		},
		//显示列表选择器
		showSelectList:function(){
			var $el = $('<a class="dropdown-toggle" id="dLabel" role="button" data-toggle="dropdown" data-target="#" href="javascript:void(0);" style="display:block;height:100%;"></a>');
			var $list = formUI.control(
				this.currentCell.head,
				'',
				'<li><a role="menuitem" tabindex="-1" href="javascript:void(0);" data-value="<%=id%>"><%=title%></a></li>',
				'<ul class="dropdown-menu" role="menu" aria-labelledby="dLabel"></ul>'
			);
			
			var that = this;
			$list.find('li').on('click',function(e){
				that.$currentCell.trigger('set',$(e.target).data('value'));
				that.setCellPosition();
			});
			
			this.$selectBox.html($el).append($list);
			this.$selectBox.find('.dropdown-toggle').dropdown();
		},
		//设置当前选定单元格位置
		setCellPosition:function(){
			var $body = this.view.$('.view-content-body');
			var top = this.$currentCell.offset().top - $body.offset().top + $body.scrollTop();
			var left = this.$currentCell.offset().left - $body.offset().left + $body.scrollLeft();
			var width = this.$currentCell.outerWidth()-3;
			var height = this.$currentCell.outerHeight()-3;
			this.$selectBox.height(height).width(width).css({top:top,left:left});
			this.w = width - 16;
			this.h = height - 16;
			this.$inputBox.css({top:top,left:left}).show();
			this.$input.height(0).width(0);
			this.$selectPoint.css({top:top+height,left:left+width});
			this.$('.select-fix').css({top:top+height-25,left:left+width-25});	
		},
		//处理双击事件
		onDblClickEvent:function(e){
			if(this.currentCell.head.get('form') === 'select'){
				//this.showSelectList(e.target);
			}else if(this.currentCell.head.get('metaType') === 'bool'){
				this.$currentCell.trigger('set',!this.$currentCell.find('input').eq(0).attr('checked'));
			}else{
				this.showInput();
				this.$input.select();
				this.clickIn = true;
				$(document).unbind('click',$.proxy(this,'selectBlurEvent'));

			}
		},
		//监听键盘按键事件
		onKeyDown:function(e){
			if(!this.isKeyEvent){
				$(document).bind('keydown',$.proxy(this,'onKeyDownEvent'));
				this.isKeyEvent = true;
			}
		},
		//取消监听键盘按键事件
		unKeyDown:function(e){
			if(this.isKeyEvent){
				$(document).unbind('keydown',$.proxy(this,'onKeyDownEvent'));
				this.isKeyEvent = false;
			}
		},
		onKeyDownEvent:function(e){
			//this.removeSelectList();
			var ctrlDown = (e.ctrlKey || e.metaKey) && !e.altKey;
			if(ctrlDown && !this.isInput){
				if(e.keyCode === 86){
					//this.$input.val('');
					this.isCopy = true;
					var that = this;
					setTimeout(function(){
						that.setCells(that.csvToArray(that.$input.val()));
						that.setCellPosition();
					},300);
				}
			}else{
				//下一格			
				if(e.keyCode === 9 || e.keyCode === 39){
					if(this.$currentCell.next('td').size() > 0){
						this.$input.blur();
						this.$currentCell.next('td').click();
					}else{
						if(e.keyCode === 9 && this.$currentCell.parent().nextAll('tr:visible').size() > 0){
							this.$currentCell.parent().nextAll('tr:visible').eq(0).find('td').eq(0).click();
						}
					}
					e.preventDefault();
				}
				//上一格
				if(e.keyCode === 37){
					if(this.$currentCell.prev('td').size() > 0){
						this.$input.blur();
						this.$currentCell.prev('td').click();
					}
					e.preventDefault();
				}
				//向上一行
				if(e.keyCode === 38){
					if(this.$currentCell.parent().prevAll('tr:visible').size() > 0){
						this.$input.blur();
						var index = this.$currentCell.parent().find('td').index(this.$currentCell);
						this.$currentCell.parent().prevAll('tr:visible').eq(0).find('td').eq(index).click();
					}
					e.preventDefault();
				}
				//向下一行
				if(e.keyCode === 40){
					if(this.$currentCell.parent().nextAll('tr:visible').size() > 0){
						this.$input.blur();
						var index = this.$currentCell.parent().find('td').index(this.$currentCell);
						this.$currentCell.parent().nextAll('tr:visible').eq(0).find('td').eq(index).click();
					}
					e.preventDefault();
				}
				
				if(this.isPrintableChar(e.keyCode) && this.isInputContent){
					if(!this.isInput){
						this.showInput(true);
					}
				}
			}
		},
		inputBlurEvent:function(e){
			this.$inputBox.height(1).width(1).css('overflow','hidden').hide();
			this.$input.height(0).width(0);
			
			if(this.isCopy){
				this.isCopy = false;
				return;
			}
			
			if(this.isInputContent){
				this.$currentCell.trigger('set',this.$input.val());
			}
			
			this.setCellPosition();
			this.isInput = false;
			$(document).on('click',$.proxy(this,'selectBlurEvent'));
			this.onKeyDown();
		},
		selectBlurEvent:function(e){
			if($(e.target).is('.editor-sheet textarea')){
				return;
			}
			if(!this.clickIn){
				this.concelSelected();
			}
			this.clickIn = false;
		},
		setCells:function(rows){
			var $d = this.$currentCell;
			var index = this.$currentCell.parent().find('td').index(this.$currentCell);
			for(var i = 0; i < rows.length ; i++){
				for(var j = 0; j < rows[i].length ; j++){
					$d.trigger('set',rows[i][j]);
					if($d.next('td').size()>0){
						$d = $d.next();
					}else{
						break;
					}
				}
				$d = $d.parent('tr').next().children('td').eq(index);
			}
		},
		//是否内容编辑按键
		isPrintableChar:function (keyCode) {
			return ((keyCode === 32) || //space
				(keyCode === 46) || //delete
				(keyCode === 8) || //backspace
				(keyCode >= 48 && keyCode <= 57) || //0-9
				(keyCode >= 96 && keyCode <= 111) || //number pad
				(keyCode >= 186 && keyCode <= 192) || //;=,-./`
				(keyCode >= 219 && keyCode <= 222) || //[]{}\|"'
				keyCode >= 226 || //special chars (229 for Asian chars)
				(keyCode >= 65 && keyCode <= 90)); //a-z
		},
		csvToArray:function(strData){
			var strDelimiter = '\t';
			var objPattern = new RegExp(
				"(\\" 
				+ strDelimiter 
				+ "|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\"\\"
				+ strDelimiter 
				+ "\\r\\n]*))"
				, "gi"
			);
			var dblQuotePattern = /""/g;
			var rows;
			if (strData.indexOf('"') === -1) {
				var r, rlen;
				rows = strData.split("\n");
				if (rows.length > 1 && rows[rows.length - 1] === '') {
					rows.pop();
				}		
				for (r = 0, rlen = rows.length; r < rlen; r++) {
					rows[r] = rows[r].split("\t");
				}
			}else {
				rows = [
					[]
				];
				var arrMatches, strMatchedValue;
				while (arrMatches = objPattern.exec(strData)) {
					var strMatchedDelimiter = arrMatches[ 1 ];
					if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
						rows.push([]);
					}
					
					if (arrMatches[2]) {
						strMatchedValue = arrMatches[2].replace(dblQuotePattern, '"');
					}else {
						strMatchedValue = arrMatches[3];
					}
					rows[rows.length - 1].push(strMatchedValue);
				}
			}
			return rows;
		}
	});
	
	var editor = {
		CustomView:CustomView,
		Content:Content,
		Sheet:Sheet
	};
	
	return editor;
});