define(function(require){
	var editor = COMS.editor;
	var tree = COMS.tree;
	var form = COMS.viewForm;
	var action = {};
	
	//上传
	action.upload = function(e,action){
		var security = action.view.model.get('data').node.security;
		if(!security || security < 4){
			alert('无上传权限（至少需要对当前节点有编辑权限）');
			return;
		}
		action.upload(e);
	};
	
	//新建目录
	action.creatCatalog = function(e,action){
		var security = action.view.model.get('data').node.security;
		if(!security || security < 4){
			alert('无新建目录权限（至少需要对当前节点有编辑权限）');
			return;
		}
		action.creat(e);
	};
	
	//重命名
	action.rename = function(e,action){
		var selectedModel = action.view.collection.findWhere({_selected:true});
		if(!selectedModel){
			alert('请选择一个需要重命名的节点');
			return;
		}
		var security = selectedModel.get('_security');
		security = security 
			? security
			:selectedModel.get('NODE_TYPE') === 'catalog'
				? security
				:action.view.model.get('data').node.security;
				
		if(!security || security < 4){
			alert('无选定节点重命名权限（至少需要对当前节点有编辑权限）');
			return;
		}
		action.edit(e);
	};
	
	//自定义视图
	action.customView = function(e,action){
		var security = action.view.model.get('data').node.security;
		if(!security || security < 4){
			alert('无自定义视图权限（至少需要对当前节点有编辑权限）');
			return;
		}
		var model = action.view.collection.findWhere({_selected:true});
		if(model && !(model.get('FILE_TYPE') === 'custom/view')){
			alert('请选择自定义视图的文件进行编辑');
			return;
		}
		var edit = new editor.CustomView({
			action:action,
			model:model
		});
		edit.render();
	};
	
	//自定义内容
	action.customContent = function(e,action){
		var security = action.view.model.get('data').node.security;
		if(!security || security < 4){
			alert('无自定义内容权限（至少需要对当前节点有编辑权限）');
			return;
		}
		var model = action.view.collection.findWhere({_selected:true});
		if(model && !(model.get('FILE_TYPE') === 'custom/content')){
			alert('请选择自定义视图的文件进行编辑');
			return;
		}
		var edit = new editor.Content({
			action:action,
			model:model
		});
		edit.render();
	};
	
	//下载
	action.download = function(e,action){
		var model = action.view.collection.findWhere({_selected:true});
		if(!model || model.get('NODE_TYPE') !== 'file'){
			alert('请选择普通文件下载');
			return;
		}
		var security = model.get('_security');
		security = security ? security : action.view.model.get('data').node.security;
		
		if(!security || security < 3){
			alert('无选定文件下载权限（至少需要对选定节点有下载权限）');
			return;
		}
		window.location = GBROS.path + "/file?_node=" + model.get('NODE_KEY');
		return;
	};
	
	//移动
	action.move = function(e,action){
		//var security = action.view.model.get('data').node.security;
		//if(!security || security < 6){
		//	alert('无当前所在节点移动权限（至少需要对当前所在节点有管理权限）');
		//	return;
		//}
		var coll = new Backbone.Collection(action.view.collection.where({_selected:true})).pluck('NODE_KEY');
		var batch = [];
		_.each(coll,function(val){
			batch.push({NODE_KEY:val});
		});
		if(coll.length < 1){
			alert('请选择要移动的目录或文件');
			return;
		}
		
		var t = new tree.Base({
			url:action.view.model.url,
			filter:{NODE_TYPE:'catalog'},
			noDisplay:coll,
			isNode:{name:'NODE_TYPE',value:'catalog',result:false},
			hasRoot:true
		});
		
		var submit = function(){
			if(t.selectedColl.size() < 1){
				alert('请选择要移动到的目标目录');
				this.enableSubmit();
				return;
			}
			
			var data = {
				NODE_KEY:t.selectedColl.at(0).get('NODE_KEY'),
				batch:batch
			};
			
			f.data = {_data:JSON.stringify(data)};
			f.commit();
		};
		
		var f = new form.Form({
			model:new Backbone.Model,
			//collection:collection,
			action:action,
			modal:true,
			attributes:{
				tabindex:"-1",
				role:"dialog",
				"aria-labelledby":"myModalLabel",
				"aria-hidden":"true"	
			},
			callBack:submit
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
	};
	
	//共享
	action.share = function(e,action){
		var node = action.view.collection.findWhere({_selected:true});
		if(!node && action.view.model.get('data').node.parents.length < 1){
			alert('请选择要共享的目录或文档');
			return;
		}
		
		var security = node
		? node.get('_security') 
			? node.get('_security') 
			: node.get('NODE_TYPE') === 'catalog'
				? null 
				: action.view.model.get('data').node.security
		: action.view.model.get('data').node.security;
		
		if(!security || security < 6){
			alert('无节点共享权限（至少需要有节点的管理权限）');
			return;
		}
		
		var nodeKey = node ? node.get('NODE_KEY') : action.view.model.get('data').node.id;
		var shares = null;
		
		$.ajax(
			GBROS.viewPath 
			+ '0142a9823970f9458a5d429dc17d0049?NODE_KEY=' 
			+ nodeKey + '&_time=' + new Date().getTime(),
			{
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
						shares = data.data.body;
					}
				}
			}
		);
		
		var submit = function(){
			shareColl.reset();
			f.trigger('commit');
			
			var ids = removeColl.pluck('USER_KEY');
			ids = _.map(ids,function(val){
				var object = {};
				object['USER_KEY'] = val;
				return object;	
			});
			
			if(shareColl.size() < 1 && ids.length < 1){
				alert('请选择要共享的用户');
				this.enableSubmit();
				return;
			}
			
			var data = {
				NODE_KEY:nodeKey,
				USERS:shareColl.toJSON(),
				remove:ids
			};
			
			f.data = {_data:JSON.stringify(data)};
			f.commit();
		};
		
		var f = new form.Form({
			model:new Backbone.Model,
			action:action,
			modal:true,
			tpl:$('#tpl-view-share').html(),
			attributes:{
				tabindex:"-1",
				role:"dialog",
				"aria-labelledby":"myModalLabel",
				"aria-hidden":"true"	
			},
			callBack:submit
		});
		
		//渲染、Class附加、开启模式窗口
		f.render().$el.addClass('modal hide fade').modal({
			keyboard: false
		});
		f.$('.modal-body').height(250);
		
		var $input = f.$('input[type=text]').eq(0);
		
		var model = new COMS.viewModel;
		var timer;
		var UserModel = Backbone.Model.extend({
			idAttribute:'USER_KEY'
		});
		var shareColl = new Backbone.Collection(null,{model:UserModel});
		var removeColl = new Backbone.Collection(null,{model:UserModel});
		var item ={
			Tip:Backbone.View.extend({
				tagName:'li',
				events:{
					'click a':'onSelect'
				},
				initialize:function(){
					
				},
				render:function(){
					var tpl = '<a tabindex="-1" href="javascript:void(0);"><%=USER_NAME%> <small><%=USER_ACCOUNT%></small></a>';
					this.$el.html(_.template(tpl,this.model.toJSON()));
					return this;	
				},
				onSelect:function(e){
					if(!shareList.collection.get(this.model.id)){
						this.model.set('_new',true);
						shareList.add(this.model);
						$list.empty().hide();
					}
				}
			})
		};
		
		item.Share = item.Tip.extend({
			tagName:'tr',
			events:{
				'click a':'removeUser'
			},
			initialize:function(){
				f.on('commit',this.setShare,this);
				this.user = new UserModel;
			},
			render:function(){
				this.$el.html(_.template($('#tpl-view-share-list').html(),this.model.toJSON()));
				this.model.get('COMPETENCE_TYPE') 
				&& this.$('option[value=' + this.model.get('COMPETENCE_TYPE') + ']').attr("selected",true);
				/*if(this.model.get('IS_INHERIT') !== undefined 
				&&  this.model.get('IS_INHERIT') !== ''){
				if(this.model.get('IS_INHERIT')){
						this.$('input[type=checkbox]').attr('checked',true);
					}else{
						this.$('input[type=checkbox]').removeAttr('checked');
					}
				}*/
				return this;
			},
			setShare:function(){
				this.user.set({
					'USER_KEY':this.model.get('USER_KEY'),
					'COMPETENCE_TYPE':this.$('select').val(),
					'IS_INHERIT':!!this.$('input[type=checkbox]').attr('checked')
				});
				shareColl.add(this.user);
			},
			removeUser:function(){
				shareColl.remove(this.user);
				shareList.collection.remove(this.model);
				if(!this.model.get('_add')){
					removeColl.add(this.model);
				}
				f.off('commit',this.setShare,this);
				this.remove();
			}
		});
		
		var SelectList = Backbone.View.extend({
			initialize:function(){
				this.$container = this.options.container ?
				$(this.options.container).appendTo(this.$el) : this.$el;
				this.items = {};
			},
			render:function(){
				this.$container.empty();
				this.collection.each(this.renderItem,this);
				return this;
			},
			renderItem:function(model){
				this.items[model.id] = new item[this.options.itemType]({
					model:model
				});
				this.$container.append(this.items[model.id].render().el);
				return this;
			},
			set:function(list){
				this.collection.reset();
				this.collection.add(list);
				this.render();
				return this;
			},
			add:function(model){
				if(this.collection.get(model.cid)){
					return this;
				}
				this.collection.add(model);
				this.renderItem(model);
				return this;
			},
			show:function(){
				this.$el.show();
			}
		});
		
		var selectList = new SelectList({
			collection:new Backbone.Collection(null,{model:UserModel}),
			tagName:'ul',
			className:'dropdown-menu',
			itemType:'Tip'
		});
		
		var shareList = new SelectList({
			collection:new Backbone.Collection(shares,{model:UserModel}),
			tagName:'table',
			className:'table table-hover share-body',
			container:'<tbody></tbody>',
			itemType:'Share'
		});
		
		f.$('.modal-body').append(shareList.render().el);
		
		var $list = selectList.render().$el;
		f.$('.input-append').css({position:'relative'}).prepend($list);
		
		var showUserList = function(){
			if(model.get('data').body.length){
				selectList.set(model.get('data').body).show();
				selectList.$el.width($input.outerWidth()).css({'top':$input.outerHeight()});
			}
		};
		
		model.url = GBROS.viewPath + '01457e233d7ff9458a5d457dfa3600e0';
		model.setCallBack(showUserList);
		
		var keyDownHandle = function(){
			var value = $input.val();
			$list.empty().hide();
			if(value !== '' && value !== model.filterModel.get('USER_NAME')){
				timer && clearTimeout(timer);
				timer = setTimeout(function(){
					model.filterModel.set({USER_NAME:$input.val()});
				},300);
			}else if(value === model.filterModel.get('USER_NAME')){
				showUserList();
			}
		};
		
		var onKeyDownEvent = function(e){
			setTimeout(function(){
				keyDownHandle();
			},50);
		};
		
		var closeList = function(e){
			model.filterModel.unset('USER_NAME',{silent:true});
			setTimeout(function(){
				$list.empty().hide();
			},200);
		};
		
		$input.on('focus',function(){
			$input.select();
			keyDownHandle();
			$(document).on('keydown',onKeyDownEvent);
		});
		
		f.$('.input-append>button').on('click',keyDownHandle);
		
		$input.on('blur',function(){
			$(document).off('keydown',onKeyDownEvent);
		});
		
		$(document).on('mousedown',closeList);
		
		//模式窗口关闭
		f.$el.on('hidden', function () {
			f.destroy();
			$(document).off('click',closeList);
			delete f;
		});
	};
	
	//授权
	action.allocation = function(e,action){
		var role = action.view.collection.findWhere({_selected:true});

		if(!role){
			alert('请选择要授权的角色');
			return;
		}
		
		var appKey = action.view.model.get("pid");
		var roleKey = role.get('ROLE_KEY');
		var resList;
		$.ajax(
			GBROS.viewPath 
			+ '6abc3a57615f482ebbfee986d499c956?ROLE_KEY=' 
			+ roleKey  + '&_time=' + new Date().getTime(),
			{
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
						resList = data.data.body;
					}
				}
			}
		);
		
		var resKeys = resList.length > 0 ? _.pluck(resList,'RES_KEY') : null;
		var t = new tree.Base({
			url:GBROS.viewPath + '0142b65177d0f9458a5d42b651770000',
			filter:{APP_KEY:appKey},
			open:resKeys ? true : false,
			multiple:true,
			gear:true,
			defaults:resKeys
		});

		var submit = function(){
			if(t.selectedColl.size() < 1){
				alert('请先选择需要授权的资源');
				this.enableSubmit();
				return;
			}
			var array = [];
			_.map(t.selectedColl.pluck('RES_KEY'),function(key){
				array.push({RES_KEY:key});
			});
			var data = {
				ROLE_KEY:roleKey,
				batch:array
			};
			
			f.data = {_data:JSON.stringify(data)};
			f.commit();
		};
		
		var f = new form.Form({
			model:role,
			//collection:collection,
			action:action,
			modal:true,
			attributes:{
				tabindex:"-1",
				role:"dialog",
				"aria-labelledby":"myModalLabel",
				"aria-hidden":"true"	
			},
			callBack:submit
		});
		
		//渲染、Class附加、开启模式窗口
		f.render().$el.addClass('modal hide fade').modal({
			keyboard: false
		});
		
		f.$('.modal-body').append(t.render().el).height(300);
		
		//模式窗口关闭
		f.$el.on('hidden', function () {
			f.destroy();
			delete f;
		});
	};
	
	// 课程资源获取
	action.fetch = function(e, action) {
		var course = action.view.collection.findWhere({
			_selected : true
		});

		if (!course) {
			alert('请选择课程');
			return;
		}

		var courseId = course.get('course_id');
		var resList;
		$.ajax(GBROS.viewPath + '0145546e6a8e4028e08145546bb000ff/'
				+ courseId + '?_time=' + new Date().getTime(), {
			async : false,
			dataType : 'json',
			error : function() {
				alert('服务器请求失败请刷新页面重试');
			},
			success : function(data, textStatus, jqXHR) {
				if (data.error) {
					alert(data.error);
				} else if (data.unlogin) {
					GBROS.logout();
				} else {
					resList = data.data.body;
				}
			}
		});

		var resIds = resList.length > 0 ? _.pluck(resList, 'res_id') : null;
		// alert(resIds);
		var t = new tree.Base({
			url : GBROS.viewPath + '01456e3912be4028e081456e326300d9',
			open : resIds ? true : false,
			isNode : {
				name : 'NODE_TYPE',
				value : 'catalog',
				result : false
			},
			hasRoot : true,
			multiple : true,
			gear : false,// 联动
			defaults : resIds
		});

		var submit = function() {
			if (t.selectedColl.size() < 1) {
				alert('请先选择课程资源');
				this.enableSubmit();
				return;
			}
			var array = [];
			t.selectedColl.map(function(model) {
				// alert(model.get("NODE_NAME")+":"+model.get("NODE_TYPE"));
				array.push({
					res_id : model.get("NODE_KEY"),
					res_name : model.get("NODE_NAME"),
					res_type : model.get("NODE_TYPE"),
					res_object : model.get("FILE_OBJECT")
				});
			});
			var data = {
				course_id : courseId,
				batch : array
			};

			f.data = {
				_data : JSON.stringify(data)
			};
			f.commit();
		};

		var f = new form.Form({
			model : course,
			// collection:collection,
			action : action,
			modal : true,
			attributes : {
				tabindex : "-1",
				role : "dialog",
				"aria-labelledby" : "myModalLabel",
				"aria-hidden" : "true"
			},
			callBack : submit
		});

		// 渲染、Class附加、开启模式窗口
		f.render().$el.addClass('modal hide fade').modal({
			keyboard : false
		});

		f.$('.modal-body').append(t.render().el).height(300);

		// 模式窗口关闭
		f.$el.on('hidden', function() {
			f.destroy();
			delete f;
		});
	};
	
	// 人工组题
	action.manMadePaper = function(e, action) {
		var paper = action.view.collection.findWhere({
			_selected : true
		});

		if (!paper) {
			alert('请选择试卷');
			return;
		} else if(paper.get('status') !== 'draft' && paper.get('status') !== 'back'){
			alert('当前试卷非草稿状态不可组卷');
			return;
		}

		var catetoryId = paper.get('category_id');
		var paperId  = paper.get('paper_id');
		var subjectList;
		$.ajax(GBROS.viewPath + '0145546da81c4028e08145546bb000c4/'
				+ paperId + '?_time=' + new Date().getTime(), {
			async : false,
			dataType : 'json',
			error : function() {
				alert('服务器请求失败请刷新页面重试');
			},
			success : function(data, textStatus, jqXHR) {
				if (data.error) {
					alert(data.error);
				} else if (data.unlogin) {
					GBROS.logout();
				} else {
					subjectList = data.data.body;
				}
			}
		});
		
		var view = COMS.view;
		var submit = function(selector) {
			if (selector.selectedList.size() < 1) {
				alert('请先选择试卷题目');
				return;
			}
			var array = [];
			_.map(selector.selectedList.pluck('subject_id'), function(key) {
				array.push({
					subject_id : key
				});
			});
			var data = {
				paper_id : paperId,
				batch : array
			};

			$.post(action.getUrl(),{_data:JSON.stringify(data)},function(data){
				if (data.error) {
					alert(data.error);
				} else if (data.unlogin) {
					GBROS.logout();
				} else {
					alert(data.ok);
					selector.exit();
				}
			},'json').fail(function(){
				alert('服务器请求失败请刷新页面重试');
			});
		};
		
		var v = new view.Selector({
			main:action.view,
			url:GBROS.viewPath + '014734781c20f9458a5d472e9143089b',
			callBack:submit,
			list:subjectList
		}).render();
		
		
	};
	
	//按分类导入试题
	action.subjectImport = function(e,action){
		var category = action.view.collection.findWhere({_selected:true});
		if(!category){
			alert('请选择一个分类体系');
			return;
		}
		var catetoryId = category.get('course_category_id');
		var fileKey='';
		var $input = $('<div class="tr"><label class="t fn-iblock">选择文件</label><input  type="file" name="_file"></input></div>');
		var $checkbox = $('<div class="tr"><label class="t fn-iblock">是否保密</label><input  type="checkbox" name="secret"></input></div>');
		var $uploadStatus = $('<div class="tr"><span>已上传</span></div>');
		var onFileChange = function(){
			var $formIframe = $('<iframe id="_uploadiFrame" name="_uploadiFrame" style="display:none;"></iframe>');
			var $form = $('<form class="hidden"></form>');
			$form.append($input);
			$('body').append($formIframe).append($form);
			var formIframe = $formIframe.get(0);
			var that = this;
			if(formIframe.attachEvent){
				formIframe.attachEvent("onload", function(){
					upload(document.frames["_uploadiFrame"].document.body.innerHTML);
				});
			} else {
				formIframe.onload = function(){
					upload(this.contentDocument.body.innerHTML);
				};
			}
			
			var upload = function(data) {
				data = jQuery.parseJSON(data);
				$formIframe.remove();
				$form.remove();
				if(data.error){
					alert(data.error);
					that.$('.control').append($input);
					return false;
				}else if(data.unlogin){
					alert(data.unlogin);
					that.$('.control').append($input);
					return false;
				}else if(data['_file']){
					fileKey = data['_file'];
					var $control = $('<input type="hidden" name="_file">');
					$control.val(data['_file']);
					$checkbox.prepend($uploadStatus).append($control);
				}else{
					alert('服务器异常：'+data);
				}
			};
			$form.attr('enctype','multipart/form-data');
			$form.attr('action',f.action.getUrl());
			$form.attr('target','_uploadiFrame');
			$form.attr('method','post');
			$form.submit();
		};
		$input.on('change',$.proxy(onFileChange,this));
		var submit = function() {
			var data = {
				course_category_id : catetoryId,
				fileKey : fileKey,
				secret : !!$checkbox.find('input:checked').size()
			};

			f.data = {
				_data : JSON.stringify(data)
			};
			f.commit();
		};
		var f = new form.Form({
			model : category,
			action : action,
			modal : true,
			attributes : {
				tabindex : "-1",
				role : "dialog",
				"aria-labelledby" : "myModalLabel",
				"aria-hidden" : "true"
			},
			callBack: submit
		});
		// 渲染、Class附加、开启模式窗口
		f.render().$el.addClass('modal hide fade').modal({
			keyboard : false
		});
		f.$('.modal-body').append($input).append($checkbox).height(150);

		// 模式窗口关闭
		f.$el.on('hidden', function() {
			f.destroy();
			delete f;
		});
	};
	
	//按分类体系导入鉴定点
	action.checkPointImport = function(e,action){
		var category = action.view.collection.findWhere({_selected:true});
		if(!category){
			alert('请选择一个分类体系');
			return;
		}
		var catetoryId = category.get('course_category_id');
		var fileKey='';
		var $input = $('<div class="tr"><label class="t fn-iblock">选择文件</label><input  type="file" name="_file"></input></div>');
		var $uploadStatus = $('<div class="tr"></div>');
		var onFileChange = function(){
			var $formIframe = $('<iframe id="_uploadiFrame" name="_uploadiFrame" style="display:none;"></iframe>');
			var $form = $('<form class="hidden"></form>');
			$form.append($input);
			$('body').append($formIframe).append($form);
			var formIframe = $formIframe.get(0);
			var that = this;
			if(formIframe.attachEvent){
				formIframe.attachEvent("onload", function(){
					upload(document.frames["_uploadiFrame"].document.body.innerHTML);
				});
			} else {
				formIframe.onload = function(){
					upload(this.contentDocument.body.innerHTML);
				};
			}
			
			var upload = function(data) {
				data = jQuery.parseJSON(data);
				$formIframe.remove();
				$form.remove();
				if(data.error){
					alert(data.error);
					that.$('.control').append($input);
					return false;
				}else if(data.unlogin){
					alert(data.unlogin);
					that.$('.control').append($input);
					return false;
				}else if(data['_file']){
					fileKey = data['_file'];
					var $control = $('<input type="hidden" name="_file">');
					var $status = $('<div class="tr"><span>已上传</span></div>');
					$control.val(data['_file']);
					$uploadStatus.prepend($status).append($control);
				}else{
					alert('服务器异常：'+data);
				}
			};
			$form.attr('enctype','multipart/form-data');
			$form.attr('action',f.action.getUrl());
			$form.attr('target','_uploadiFrame');
			$form.attr('method','post');
			$form.submit();
		};
		$input.on('change',$.proxy(onFileChange,this));
		var submit = function() {
			var data = {
				course_category_id : catetoryId,
				fileKey : fileKey,
				secret : !!$checkbox.find('input:checked').size()
			};

			f.data = {
				_data : JSON.stringify(data)
			};
			f.commit();
		};
		var f = new form.Form({
			model : category,
			action : action,
			modal : true,
			attributes : {
				tabindex : "-1",
				role : "dialog",
				"aria-labelledby" : "myModalLabel",
				"aria-hidden" : "true"
			},
			callBack: submit
		});
		// 渲染、Class附加、开启模式窗口
		f.render().$el.addClass('modal hide fade').modal({
			keyboard : false
		});
		f.$('.modal-body').append($input).append($uploadStatus).height(150);

		// 模式窗口关闭
		f.$el.on('hidden', function() {
			f.destroy();
			delete f;
		});
	};
	
	//获取组织机构人员列表
	action.trainUserChoose = function(e, action) {
		var trainClass = action.view.collection.findWhere({
			_selected : true
		});

		if (!trainClass) {
			alert('请选择培训班');
			return;
		}

		var classId = trainClass.get('class_id');
		var studentList;
		$.ajax(GBROS.viewPath + '01473ed0fe23f9458a5d473e90b403b6/'
				+ classId + '?_time=' + new Date().getTime(), {
			async : false,
			dataType : 'json',
			error : function() {
				alert('服务器请求失败请刷新页面重试');
			},
			success : function(data, textStatus, jqXHR) {
				if (data.error) {
					alert(data.error);
				} else if (data.unlogin) {
					GBROS.logout();
				} else {
					studentList = data.data.body;
				}
			}
		});
		
		var studentIds = studentList.length > 0 ? _.pluck(studentList, 'student_id') : null;
		var t = new tree.Base({
			url : GBROS.viewPath + '014713e7b1c3f9458a5d46f143c70e24',
			open : false,
			multiple : true,
			gear : true,
			defaults : studentIds
		});

		var submit = function() {
			if (t.selectedColl.size() < 1) {
				alert('请先选择培训班报名学员');
				this.enableSubmit();
				return;
			}
			var array = [];
			_.map(t.selectedColl.pluck('id'), function(key) {
				array.push({
					student_id : key
				});
			});
			var data = {
				class_id : classId,
				batch : array
			};

			f.data = {
				_data : JSON.stringify(data)
			};
			f.commit();
		};

		var f = new form.Form({
			model : trainClass,
			action : action,
			modal : true,
			attributes : {
				tabindex : "-1",
				role : "dialog",
				"aria-labelledby" : "myModalLabel",
				"aria-hidden" : "true"
			},
			callBack : submit
		});

		// 渲染、Class附加、开启模式窗口
		f.render().$el.addClass('modal hide fade').modal({
			keyboard : false
		});

		f.$('.modal-body').append(t.render().el).height(300);

		// 模式窗口关闭
		f.$el.on('hidden', function() {
			f.destroy();
			delete f;
		});
	};
	
	action.allStudentChoose2 = function(e, action) {
		var trainClass = action.view.collection.findWhere({
			_selected : true
		});

		if (!trainClass) {
			alert('请选择培训班');
			return;
		} else if(trainClass.get('status') !== 'draft' && trainClass.get('status') !== 'back'){
			alert('当前培训班非创建状态不可选择培训学员');
			return;
		}

		var classId = trainClass.get('class_id');
		var studentList;
		$.ajax(GBROS.viewPath + '0145546f06424028e08145546bb00143/'
				+ classId + '?_time=' + new Date().getTime(), {
			async : false,
			dataType : 'json',
			error : function() {
				alert('服务器请求失败请刷新页面重试');
			},
			success : function(data, textStatus, jqXHR) {
				if (data.error) {
					alert(data.error);
				} else if (data.unlogin) {
					GBROS.logout();
				} else {
					studentList = data.data.body;
				}
			}
		});
		
		var view = COMS.view;
		var submit = function(selector) {
			if (selector.selectedList.size() < 1) {
				alert('请先选择试卷题目');
				return;
			}
			var array = [];
			_.map(selector.selectedList.pluck('student_id'), function(key) {
				array.push({
					student_id : key
				});
			});
			var data = {
				class_id : classId,
				batch : array
			};

			$.post(action.getUrl(),{_data:JSON.stringify(data)},function(data){
				if (data.error) {
					alert(data.error);
				} else if (data.unlogin) {
					GBROS.logout();
				} else {
					alert(data.ok);
					selector.exit();
				}
			},'json').fail(function(){
				alert('服务器请求失败请刷新页面重试');
			});
		};
		
		var v = new view.Selector({
			main:action.view,
			url:GBROS.viewPath + '0145546bb6f94028e08145546bb00013',
			callBack:submit,
			list:studentList
		}).render();
		
		
	};
	
	//获取组织机构人员列表
	action.allStudentChoose = function(e, action) {
		var trainClass = action.view.collection.findWhere({
			_selected : true
		});

		if (!trainClass) {
			alert('请选择培训班');
			return;
		}

		var classId = trainClass.get('class_id');
		var studentList;
		$.ajax(GBROS.viewPath + '0145546f06424028e08145546bb00143/'
				+ classId + '?_time=' + new Date().getTime(), {
			async : false,
			dataType : 'json',
			error : function() {
				alert('服务器请求失败请刷新页面重试');
			},
			success : function(data, textStatus, jqXHR) {
				if (data.error) {
					alert(data.error);
				} else if (data.unlogin) {
					GBROS.logout();
				} else {
					studentList = data.data.body;
				}
			}
		});
		
		var studentIds = studentList.length > 0 ? _.pluck(studentList, 'student_id') : null;
		var t = new tree.Base({
			url : GBROS.viewPath + '01472f369dd4f9458a5d472e914302e8',
			open : false,
			multiple : true,
			gear : true,
			defaults : studentIds
		});

		var submit = function() {
			if (t.selectedColl.size() < 1) {
				alert('请先选择培训班报名学员');
				this.enableSubmit();
				return;
			}
			var array = [];
			_.map(t.selectedColl.pluck('id'), function(key) {
				array.push({
					student_id : key
				});
			});
			var data = {
				class_id : classId,
				batch : array
			};

			f.data = {
				_data : JSON.stringify(data)
			};
			f.commit();
		};

		var f = new form.Form({
			model : trainClass,
			action : action,
			modal : true,
			attributes : {
				tabindex : "-1",
				role : "dialog",
				"aria-labelledby" : "myModalLabel",
				"aria-hidden" : "true"
			},
			callBack : submit
		});

		// 渲染、Class附加、开启模式窗口
		f.render().$el.addClass('modal hide fade').modal({
			keyboard : false
		});

		f.$('.modal-body').append(t.render().el).height(300);

		// 模式窗口关闭
		f.$el.on('hidden', function() {
			f.destroy();
			delete f;
		});
	};
		//培训班主任，获取组织机构人员，进行考试报名列表
	action.examStudentChoose = function(e, action) {
		var exam = action.view.collection.findWhere({
			_selected : true
		});

		if (!exam) {
			alert('请选择考试');
			return;
		}

		var examId = exam.get('exam_id');
		var studentList;
		$.ajax(GBROS.viewPath + '01455470ba734028e08145546bb00204/'
				+ examId + '?_time=' + new Date().getTime(), {
			async : false,
			dataType : 'json',
			error : function() {
				alert('服务器请求失败请刷新页面重试');
			},
			success : function(data, textStatus, jqXHR) {
				if (data.error) {
					alert(data.error);
				} else if (data.unlogin) {
					GBROS.logout();
				} else {
					studentList = data.data.body;
				}
			}
		});
		
		var studentIds = studentList.length > 0 ? _.pluck(studentList, 'student_id') : null;
		var t = new tree.Base({
			url : GBROS.viewPath + '01472f369dd4f9458a5d472e914302e8',
			open : false,
			multiple : true,
			gear : true,
			defaults : studentIds
		});

		var submit = function() {
			if (t.selectedColl.size() < 1) {
				alert('请先选择培训班报名学员');
				this.enableSubmit();
				return;
			}
			var array = [];
			_.map(t.selectedColl.pluck('id'), function(key) {
				array.push({
					student_id : key
				});
			});
			var data = {
				exam_id : examId,
				batch : array
			};

			f.data = {
				_data : JSON.stringify(data)
			};
			f.commit();
		};

		var f = new form.Form({
			model : exam,
			action : action,
			modal : true,
			attributes : {
				tabindex : "-1",
				role : "dialog",
				"aria-labelledby" : "myModalLabel",
				"aria-hidden" : "true"
			},
			callBack : submit
		});

		// 渲染、Class附加、开启模式窗口
		f.render().$el.addClass('modal hide fade').modal({
			keyboard : false
		});

		f.$('.modal-body').append(t.render().el).height(300);

		// 模式窗口关闭
		f.$el.on('hidden', function() {
			f.destroy();
			delete f;
		});
	};
	
//选择文件进行导入
	action['import'] = function(e,action){
		var fileKey = '';
		var $input = $('<div class="tr"><label class="t fn-iblock">选择文件</label><input  type="file" name="_file"></input></div>');
		var $uploadStatus = $('<div class="tr"></div>');
		var $status = $('<div class="tr"><span>已上传</span></div>');
		var onFileChange = function(){
			var $formIframe = $('<iframe id="_uploadiFrame" name="_uploadiFrame" style="display:none;"></iframe>');
			var $form = $('<form class="hidden"></form>');
			
			$form.append($input);
			$('body').append($formIframe).append($form);
			var formIframe = $formIframe.get(0);
			var that = this;
			if(formIframe.attachEvent){
				formIframe.attachEvent("onload", function(){
					upload(document.frames["_uploadiFrame"].document.body.innerHTML);
				});
			} else {
				formIframe.onload = function(){
					upload(this.contentDocument.body.innerHTML);
				};
			}
			var upload = function(data) {
				data = jQuery.parseJSON(data);
				$formIframe.remove();
				$form.remove();
				if(data.error){
					alert(data.error);
					that.$('.control').append($input);
					return false;
				}else if(data.unlogin){
					alert(data.unlogin);
					that.$('.control').append($input);
					return false;
				}else if(data['_file']){
					fileKey = data['_file'];
					var $control = $('<input type="hidden" name="_file">');
					$control.val(data['_file']);
					$uploadStatus.prepend($status).append($control);
				}else{
					alert('服务器异常：'+data);
				}
			};
			$form.attr('enctype','multipart/form-data');
			$form.attr('action',f.action.getUrl());
			$form.attr('target','_uploadiFrame');
			$form.attr('method','post');
			$form.submit();
		};
		$input.on('change',$.proxy(onFileChange,this));
		var submit = function() {
			var data = {
				fileKey : fileKey
			};

			f.data = {
				_data : JSON.stringify(data)
			};
			f.commit();
		};
		var f = new form.Form({
			model : new Backbone.Model,
			action : action,
			modal : true,
			attributes : {
				tabindex : "-1",
				role : "dialog",
				"aria-labelledby" : "myModalLabel",
				"aria-hidden" : "true"
			},
			callBack: submit
		});
		// 渲染、Class附加、开启模式窗口
		f.render().$el.addClass('modal hide fade').modal({
			keyboard : false
		});
		f.$('.modal-body').append($input).append($uploadStatus).height(150);

		// 模式窗口关闭
		f.$el.on('hidden', function() {
			f.destroy();
			delete f;
		});
	};
	
	//下载
	action.exportFile = function(e,action){
		//var model = action.view.collection.findWhere({_selected:true});
		var filters = action.view.model.filterModel.toJSON();
		window.location = action.getUrl() + "?" + $.param(filters);
		return;
	};
	
		//下载
	action.exportWord = function(e,action){
		var paper = action.view.collection.findWhere({_selected:true});
		if (!paper) {
			alert('请选择导出试卷');
			return;
		}
		var paper_id = paper.get('paper_id');
		window.location = action.getUrl() + "?" + "paper_id=" + paper_id;
		return;
	};
	
	return action;
});

