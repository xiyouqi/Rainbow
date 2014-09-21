define(function(require){
	var form = COMS.viewForm;
	var formUI = COMS.formUI;
	var tree = COMS.tree;
	var filter = require('../base/filter');
	var minute = function(){
			var view = COMS.view;
			var v = new view.Minute({
				main:this.view,
				model:this.model
			}).render();
	};
	
	//面包屑项定义
	var BreadcrumbItem = Backbone.View.extend({
		tagName:'li',
		events:{
			'click a':'onNodeFilter'
		},
		initialize:function(){
			this.view = this.options.view;
			this.tpl = this.options.tpl ? this.options.tpl : '<%=name%>';
		},
		render:function(){
			this.$el.html(_.template(this.tpl,this.model.toJSON()));
			return this;	
		},
		onNodeFilter:function(e){
			this.view.nodeNav(this.model.get('id'));
			return false;
		}
	});
	
	//Action项定义
	var ActionItem = Backbone.View.extend({
		tagName:'button',
		className:'btn',
		events:{
			'click':'e'
		},
		initialize:function(){
			this.view = this.options.view;
		},
		//点击事件路由
		e:function(e){
			var ext,action;
			if(this.model.get('event')){
				if(this.model.get('event').substr(0,4) === 'ext.'){
					action = this.model.get('event').slice(4);
					ext = require('../extend/action');
					ext[action](e,this);
				}else{
					this[this.model.get('event')](e);
				}
			}else{
				alert(this.model.get('name') + '未设置前端事件');
			}
		},
		//表单处理
		form:function(collection,model,type){
			model = model ? model : new Backbone.Model;
			type = type ? type : 'Form';
			var v = new form[type]({
				model:model,
				collection:collection,
				action:this,
				modal:true
			});
			this.modal(v);
		},
		//模式窗口
		modal:function(v){
			
			//设置模式窗口DOM属性
			v.attributes = {
				tabindex:"-1",
				role:"dialog",
				"aria-labelledby":"myModalLabel",
				"aria-hidden":"true"	
			};
			
			//渲染、Class附加、开启模式窗口
			v.render().$el.addClass('modal hide fade').modal({
				keyboard: false
			});
			
			//模式窗口关闭
			v.$el.on('hidden', function () {
				v.destroy();
				delete v;
			});
		},
		//创建单项
		creat:function(e){
			//Tree模式新增时辅助设置选择项为默认值
			if(this.view.model.get('mode') === 'tree' && this.view.model.get('param').nodeName){
				var selectedModel = this.view.collection.findWhere({_selected:true});
				var nodeName = this.view.model.get('param').nodeName;
				if(selectedModel){
					this.view.headCollection.findWhere({
						name:nodeName
					}).set('value',selectedModel.get(this.view.idName));
				}else{
					this.view.headCollection.findWhere({
						name:nodeName
					}).set('value','');
				}
			}
			
			this.form(
				new Backbone.Collection(
					this.view.headCollection.where({creat:true,isSys:false})
				)
			);
		},
		//编辑单项
		edit:function(e){
			var selectedModel = this.view.collection.findWhere({_selected:true});
			if(!selectedModel){
				alert('请选择至少一条数据');
				return;
			}
			this.form(
				new Backbone.Collection(
					this.view.headCollection.where({
						display:true,
						edit:true,
						isSys:false
					})
				),
				selectedModel
			);
		},
		request:function(e){
			$.ajax(this.getUrl(),{
				context:this,
				dataType:'json',
				success:function(data,textStatus,jqXHR){
					if(data.error){
						alert(data.error);
						return false;
					}else if(data.unlogin){
						return false;
					}else if(data.ok){
						alert(data.ok);
						this.view.model.request();
					}else{
						alert('服务器异常：' + data);
					}
				},
				error:function(){
					if(confirm('访问服务器失败，是否重试?')){
						this.batch();
					}else{
						return false;
					}
				}
			});
		},
		//上传文件
		upload:function(e){
			this.form(
				new Backbone.Collection(
					this.view.headCollection.where({creat:true})
				),
				null,
				'UploadForm'
			);
		},
		update:function(e){
			
		},
		//批量处理
		batch:function(e,max,method){
			var coll = new Backbone.Collection(this.view.collection.where({_selected:true}));
			if(!coll.length){
				alert('请先选择要操作的数据');
				return this;
			}
			
			if(max && coll.length > max){
				alert('最多只能选择' + max + '行数据');
				return;
			}
			
			if(!confirm('确认要对选定的' + coll.length + '行数据进行【' + this.model.get('name') + '】操作吗？')){
				return false;
			}
			var method = method ? method : 'batch';
			var idName = this.view.idName;
			var ids = coll.pluck(idName);
			delete coll;
			ids = _.map(ids,function(val){
				var object = {};
				object[idName] = val;
				return object;	
			});
			
			var object = {};
			object[method] = ids;
			
			$.ajax(this.getUrl(),{
				type:'post',
				context:this,
				data:$.param({_data:JSON.stringify(object)}),
				dataType:'json',
				success:function(data,textStatus,jqXHR){
					if(data.error){
						alert(data.error);
						return false;
					}else if(data.unlogin){
						
						return false;
					}else if(data.ok){
						alert(data.ok);
						this.view.model.request();
					}else{
						alert('服务器异常：'+data);
					}
				},
				error:function(){
					if(confirm('访问服务器失败，是否重试?')){
						this.batch();
					}else{
						return false;
					}
				}
			});
			
		},
		//单项处理
		one:function(e){
			this.batch(e,1);
		},
		//移除项
		remove:function(e){
			this.batch(e,null,'remove');
		},
		//启动编辑器
		editor:function(e){
			var body;
			var coll = new Backbone.Collection(this.view.collection.where({_selected:true}));
			if(!coll.length){
				body = [];
			}else{
				body = coll.toJSON();
			}
			
			var view = COMS.view;
			var model = new Backbone.Model({
				action:[
					{
						desc: "关闭编辑器",
						event: "cancel",
						frontObject: "",
						group: "",
						iconUrl: "icon-repeat",
						id: "2",
						name: "取消",
						primary: "",
						selected: "",
						type: ""
					},{
						desc: "保存修改",
						event: "save",
						frontObject: "",
						group: "",
						iconUrl: "icon-inbox",
						id: "1",
						name: "保存",
						primary: "1",
						selected: "",
						type: ""
					}
				],
				attr:{
					head:this.view.model.get('attr').head,
					idName:this.view.idName,
					filter:[]
				},
				id:this.view.model.get('id') + '-editor',
				name:this.view.model.get('name'),
				mode:this.view.model.get('mode'),
				type:'',
				tpl:'',
				trTpl:'',
				notSelected:true,
				param:this.view.model.get('param'),
				data:{
					body:body,
					page:{}	
				}
			});
			var v = new view.Editor({
				main:this.view,
				model:model,
				action:this
			});
			v.render();
		},
		minute:function(e){
			minute.apply(this);
		},
		//编辑器保存
		save:function(e){
			this.view.trigger('verify');
			if(this.view.$('td.error').size() > 0){
				alert('请正确填写红色背景的单元格数据');
				return;
			}
			var idName = this.view.idName;
			var ids = this.view.removeCollection.pluck(idName);
			ids = _.map(ids,function(val){
				var object = {};
				object[idName] = val;
				return object;	
			});
			
			var object = {
				save:this.view.collection.toJSON(),
				remove:ids
			};
			var $e = $(e.target);
			$.ajax(this.view.mainAction.getUrl(),{
				type:'post',
				context:this,
				data:$.param({_data:JSON.stringify(object)}),
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
						this.view.mainView.model.request();
						this.view.mainView.$el.show();
						this.view.destroy();
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
		//工作流审批
		check:function(e){
			var coll = new Backbone.Collection(this.view.collection.where({_selected:true}));
			if(coll.length < 1){
				alert('请至少选择一条工作流数据');
				return;
			}
			var object = coll.at(0);
			var data = {};
			var flow = object.get('flow_object');
			flow = flow ? JSON.parse(flow) : null;
			var fields = flow.param.operate_field;
			var allow_over = flow.param.allow_over;
			var allow_back_origin = flow.param.allow_back_origin;
			var collection = new Backbone.Collection;
			var head = this.view.headCollection;
			var formModel = new Backbone.Model;
			
			collection.add({
				alias: "审批类型",
				creat: true,
				desc: "",
				filter: "",
				form: "radio",
				formParam: "",
				formRule: "",
				formTpl: "",
				group: "",
				keyType: "",
				max: 0,
				metaType: "enum",
				min: 0,
				name: "check_type",
				only: false,
				remind: "",
				required: true,
				tpl: "",
				typeObject: {
					list: [
						{title: "通过",value: "pass"},
						{title: "退回",value: "unpass"}
					]
				},
				value: ""
			});
			
			collection.add({
				alias: "审批意见",
				form: "textarea",
				metaType: "enum",
				min: 0,
				name: "deal_note",
				only: false,
				remind: "",
				required: false
			});
			
			//操作表单字段
			if(fields){
				_.each(fields,function(a){
					var field = head.findWhere({name:a});
					object.get(a) && formModel.set(a,object.get(a));
					a && collection.add(field.toJSON());
				});
			}
			
			//允许用户关闭工作流
			if(allow_over){
				collection.add({
					alias: "结束工作流",
					form: "checkbox",
					min: 0,
					name: "allow_over",
					only: false,
					remind: "",
					required: false,
					metaType: "bool"
				});
			}
			
			//允许用户返回原点（发起人）
			if(allow_back_origin){
				collection.add({
					alias: "退回发起人",
					form: "checkbox",
					min: 0,
					name: "allow_back_origin",
					only: false,
					remind: "",
					required: false,
					metaType: "bool"
				});
			}
			
			function submit(data, form) {
				var object = {};
				object.id = [];
				
				coll.each(function(model){
					object.id.push({_id:model.get('_id')});
				});
				
				object.flow_object = {
					check_type:data.check_type,
					deal_note:data.deal_note
				};

				data.allow_over && (object.flow_object.allow_over = data.allow_over);
				data.allow_back_origin && (object.flow_object.allow_back_origin = data.allow_back_origin);
				
				object.data_object = {};
				fields && _.each(fields,function(a){
					object.data_object[a] = (data[a] !== undefined) ? data[a] : '';
				});
				form.data = {_data:JSON.stringify(object)};
				form.commit();
			}
			
			var v = new form['Form']({
				model : formModel,
				collection : collection,
				action : this,
				modal : true,
				callBack : submit
			});
			this.modal(v);
		},
		//提交服务器
		commit:function(action,data,success,e){
			$e = $(e);
			$.ajax(action,{
				type:'post',
				context:this,
				data:$.param({_data:JSON.stringify(data)}),
				dataType:'json',
				success:function(data,textStatus,jqXHR){
					if(data.error){
						alert(data.error);
						e && $e.removeClass('disabled');
					}else if(data.unlogin){
						e && $e.removeClass('disabled');
						GBROS.logout();
					}else if(data.ok){
						alert(data.ok);
						success && success();
					}else{
						alert('服务器异常：'+data);
						e && $e.removeClass('disabled');
					}
				},
				error:function(){
					e && $e.removeClass('disabled');
					if(confirm('访问服务器失败，是否重试?')){
						this.save();
					}
				}
			});
		},
		//清除视图
		cancel:function(e){
			this.view.mainView.show();
			this.view.mainView.body.setHeadWidth();
			this.view.destroy();
		},
		render:function(){
			this.$el.html(_.template($('#tpl-view-action-li').html(),this.model.toJSON()));
			if(this.model.get('primary')){
				this.$el.addClass('btn-success');
			}else{
				this.$el.addClass('btn-default');
			}
			return this;
		},
		getUrl:function(){
			var url = GBROS.actionPath + this.model.get('id');
			if(this.view.params){
				url += '/' + this.view.params.join('/');
			}
			return url;
		},
		refresh:function(){
			this.view.model.request();
		}
	});
	
	var FilterItem = Backbone.View.extend({
		tagName:'div',
		className:'tr fn-iblock',
		events:{
			'change input,textarea,select':'onChange'
		},
		initialize:function(){
			this.view = this.options.view;
			this.head = this.view.headCollection.findWhere({name:this.model.get('name')}).clone();
			var isNull = (this.model.get('isNull') === false)?false:true;
			this.head.set({isNull:isNull});
		},
		render:function(){
			this.model.get('form') && this.head.set({form:this.model.get('form')});
			this.model.get('value') && this.head.set({value:this.model.get('value')});
			this.$el.html(_.template($('#tpl-filter-item').html(),this.head.toJSON()));
			this.$('.control').append(formUI.control(this.head,this.model.get('value')));
			if(this.head.get('metaType') === 'date' || this.head.get('metaType') === 'time'){
				this.timeFilter();
			}
			
			if(this.model.get('form') === 'chosen'){
				//this.$(".chosen-select").chosen({width: '300px'});
				this.$(".chosen-select").css('width',300).select2();
			}
			
			return this;	
		},
		timeFilter:function(){
			var $input = this.$('input');
			if(this.head.get('metaType') === 'date'){
				if($input.val()){
					$input.val(timeFilter.date($input.val()));
				}
				$input.datetimepicker({
			    language:  'zh-CN',
			    format: 'yyyy-mm-dd',
			    weekStart: 1,
      		todayBtn:  1,
					autoclose: 1,
					todayHighlight: 1,
					startView: 2,
					minView: 2,
					forceParse: 0
				});
			}
			
			if(this.head.get('metaType') === 'time'){
				$input = this.$('input');
				if($input.val()){
					$input.val(timeFilter.time($input.val(), true));
				}
				$input.datetimepicker({
					language:  'zh-CN',
			    format: 'yyyy-mm-dd hh:ii',
			    weekStart: 1,
	    		todayBtn:  1,
					autoclose: 1,
					todayHighlight: 1,
					startView: 2,
					forceParse: 0,
	    		showMeridian: 1
				});
			}
		},
		onChange:function(e){
			if(this.model.get('form') === 'chosen' && $(e.target).is('input')){
				return;
			}
			var value = formUI.getVal(e.target);
			this.setFilter(value);
		},
		setFilter:function(value){
			var attr = {};
			
			if(this.view.model.filterModel.get('_page')){
					attr._page = 1;
			}
				
			if(value || value === false){
				attr[this.model.get('name')] = value;
				this.view.model.filterModel.set(attr);
			}else{
				this.view.model.filterModel.set(attr,{silent: true});
				this.view.model.filterModel.unset(this.model.get('name'));
			}
		}
	});
	
	var FilterTreeItem = FilterItem.extend({
		render:function(){
			var tree = COMS.tree;
			var t = new tree.Base({
				hasRoot:true,
				model:new Backbone.Model(this.head.get('typeObject').viewObject)
			}).render();
			
			t.on('selected',function(e){
				if(t.selectedColl.length){
					this.setFilter(t.selectedColl.at(0).get(t.model.get('attr').idName));
				}else{
					this.setFilter(null);
				}
			},this);
			this.view.$('.J-view-side').show().append(t.el);
			this.view.$el.addClass('side');
		}
	});
	
	var TabItem = Backbone.View.extend({
		tagName:'li',
		events:{
			'click':'onClick'
		},
		initialize:function(){
			this.component = null;
			this.view = this.options.view;
		},
		render:function(){
			var html = '<a href="javascript:void(0);"><%=name%></a>';
			this.$el.html(_.template(html,this.model.toJSON()));
			if(!this.model.get('id')){
				this.$el.addClass('active');
			}
			return this;
		},
		onClick:function(){
			this.$el.siblings().removeClass('active');
			this.$el.addClass('active');
			if(this.model.get('id')){
				this.display();
			}else{
				this.view.$('.J-view-minute').html(this.view.content.el);
			}
		},
		display:function(){
			if(!this.component){
				this.createComponent();
			}
		},
		createComponent:function(){
			var model = new COMS.viewModel;
			var that = this;
			var id = this.view.model.get(this.view.mainView.idName);
			model.url = GBROS.viewPath + this.model.get('id') + '/' + id;
			model.setCallBack(function(){
				var view = new COMS.view.General({
					model:this,
					id:'view-' + this.id,
					isNested:true,
					params:[id]
				}).render();
				model.view = view;
				view.$('.common-bar').hide();
				that.view.$('.J-view-minute').html(view.setBodyHeight().el);
			});
			model.request();
		}
	});
	
	var SettingItem = Backbone.View.extend({
		tagName:'button',
		className:'btn',
		initialize:function(){
			
		},
		render:function(){
			return this;	
		}
	});
	
	var PaginationItem = Backbone.View.extend({
		tagName:'li',
		events:{
			'click a:not(.disabled)':'onClick'
		},
		initialize:function(){
			this.view = this.options.view;
		},
		render:function(){
			this.$el.html('<a href="javascript:void(0);">'+this.model.get('title')+'</a>');
			if(this.view.model.filterModel.get('_page') === this.model.get('no')){
				this.$el.addClass('disabled');
			}
			return this;	
		},
		onClick:function(){
			this.$el.siblings().removeClass('disabled');
			this.$el.addClass('disabled');
			this.view.model.filterModel.set('_page',this.model.get('no'));
		}
	});
	
	//基础单元定义
	var Cell = {
		Base:Backbone.View.extend({
			initialize:function(){
				this.row = this.options.row;
				this.head = this.options.head;
				this.isHead = this.options.isHead;
			},
			render:function(){
				this.$el.append('<span></span>');
				this.renderVal();
				return this;
			},
			getWordbook:function(value,head){
				var book = this.row.view._cacheWordbook[head.get('name')] 
				? this.row.view._cacheWordbook[head.get('name')] : null;
				if(!book){
					book = {};
					book.idName = head.get('typeObject').viewObject.attr.idName;
					book.idMetaType = _.findWhere(head.get('typeObject').viewObject.attr.head,{name:book.idName}).metaType;
					book.head = new Backbone.Collection(head.get('typeObject').viewObject.attr.head);
					book.titleName = book.head.findWhere({isTitle:true}).get('name');
					//book.body = new Backbone.Collection(head.get('typeObject').viewObject.data.body);
					book.body = head.get('typeObject').viewObject.data.body;
					book.values = {};
					this.row.view._cacheWordbook[head.get('name')] = book;
				}else if(book.values[value]){
					return book.values[value];
				}
				
				/*var filter = {};
				if(book.idMetaType === 'key' || book.idMetaType === 'string'){
					filter[book.idName] = value + '';
				}else{
					filter[book.idName] = value;
				}*/
				
				if(book.idMetaType === 'key' || book.idMetaType === 'string'){
					value = value +  '';
				}
				
				var find = function(list, value){
					var str = null;
					for(var i = 0; i < list.length; i++){
						if(list[i][book.idName] == value){
							return list[i][book.titleName];
						} else {
							if(list[i]['_childList'] && list[i]['_childList'].length){
								str = find(list[i]['_childList'], value);
								if(str){
									return str;
								}
							}
						}
					}
					return str;
				};
				
				//var v = book.body.findWhere(filter);
				//v = v ? v.get(book.titleName) : '';
				var v = find(book.body, value); 
				v = v ? v : '';
				book.values[value] = {name:v};
				return book.values[value];
			},
			getEnum:function(value,head){
				var enums = this.row.view._cacheEnum[head.get('name')] 
				? this.row.view._cacheEnum[head.get('name')] : null;
				
				if(!enums){
					enums = {};
					enums.list = new Backbone.Collection(head.get('typeObject').list);
					enums.values = {};
				}else if(enums.values[value]){
					return enums.values[value];
				}
				
				var v = enums.list.findWhere({value:value + ''});
				v = v ? v.get('title') : value;
				enums.values[value] = {name:v};
				return enums.values[value];
			},
			renderVal:function(){
				var html = (this.head.get('isTitle') && !this.isHead )
				? '<a href="javascript:void(0);" class="J-cell-title"><%=_.escape(name)%></a>'
				: '<%=name%>';

				if(!this.isHead
					&& this.head.get('metaType') === 'wordbook'
					&& this.head.get('typeObject')){
					this.model.set(
						this.getWordbook(this.model.get('name'),this.head)
					);
				}
				
				if(!this.isHead 
					&& this.head.get('metaType') === 'enum' 
					&& this.head.get('typeObject')){
					this.model.set(
						this.getEnum(this.model.get('name'),this.head)
					);
				}
				
				html = (this.model.get('name') === '') ? '&nbsp;' : html;
				
				if(typeof this.model.get('name') === 'object' && this.model.get('name') !== null){
					this.model.set('name',JSON.stringify(this.model.get('name')));
				}
				
				if(this.head.get('tpl')){
					this.$('span').html(_.template(this.head.get('tpl'),this.model.toJSON()));
				}else{
					this.$('span').html(_.template(html,this.model.toJSON()));
				}
				
				return this;
			}
		})
	};
	
	//编辑单元定义
	Cell.Edit = Cell.Base.extend({
		initialize:function(){
			Cell.Base.prototype.initialize.apply(this, arguments);
			this.row = this.options.row;
			this.row.view.on('verify',this.verify,this);
		},
		renderVal:function(){
			Cell.Base.prototype.renderVal.apply(this, arguments);
			if(this.head.get('metaType') === 'bool' && !this.isHead){
				var $box = $('<input type="checkbox" />');
				if(this.model.get('name')){
					$box.attr("checked", true);
				}
				this.$el.html($box);
			}
			return this;
		},
		events:{
			'click':'onClick',
			'set':'setVal'
		},
		onClick:function(e){
			var $t = $(e.target);
			if($t.is('em')){
				
			}else{
				this.row.view.editor.onCell(e,this);
				return false;
			}
			
		},
		verify:function(){
			if(_.isEmpty(this.row.model.toJSON()) || this.row.isHead){
				return;
			}
			var val = this.row.model.get(this.head.get('name'));
			var error = formUI.verify(this.head,val);
			if(error){
				this.$el.addClass('error').attr('title',error);
			}else{
				this.$el.removeClass('error').removeAttr('title');
			}
			return this;
		},
		setVal:function(e,val){
			var object = {};
			var key = this.head.get('name');
			if(this.row.model.get(key) === undefined && val === ''){
				return;
			}
			object[key] = val;
			this.row.model.set(object);
			this.model.set('name',val);
			this.verify();
			this.renderVal();
		}
	});
	
	//行对象
	var Row = {};
	
	//基础行定义
	Row.Base = Backbone.View.extend({
		cellType:'Base',
		events:{
			'click':'onClick',
			'click .J-cell-title':'minute',
			'close':'onClose'
		},
		initialize:function(){
			this.view = this.options.view;
			this.parent = this.options.parent;
			//this.parent && this.parent.on('renderChild',this.renderToParent,this);
			this.isHead = this.options.isHead;
			this.isEmpty = this.options.isEmpty;
			this.container = this.options.container ? this.options.container : this.container;
			this.colNum = 0;
			this.hasHide = false;
			this.model.on('change:_selected',this.setSelected,this);
		},
		render:function(){
			this.$el.empty();
			var head,value;
			
			var len = this.view.headCollection.length;
			for(var i = 0; i < len; i++){
				head = this.view.headCollection.at(i);
				value = this.model.get(head.get('name'));
				value = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : value ;
				value = filter[head.get('metaType')] && !this.isHead ? filter[head.get('metaType')](value) : value;
				value = this.isEmpty?{name:''}:{name:value};
				if(head && head.get('display')){
					if(head.get('name') === this.view.idName){
						if(!this.view.model.get('notSelected')){
							head.set({'tpl':'<input type="checkbox" />'});
							head.set({'attr':{width:'20px'}});
							this.readerCell(new Backbone.Model(value),i,head,true);
							this.colNum++;
						}
					}else if(!head.get('hide') || this.hasHide){
						this.readerCell(new Backbone.Model(value),i,head);
						this.colNum++;
					}
				}
			}
			return this;	
		},
		readerCell:function(model,i,head,prepend){
			var cell = new Cell[this.cellType]({
				model:model,
				head:head,
				tagName:this.container,
				attributes:head.get('attr')?head.get('attr'):null,
				isHead:this.isHead,
				row:this
			});
			
			if(prepend){
				this.$el.prepend(cell.render().el);
			}else{
				this.$el.append(cell.render().el);
			}
			cell.$el.addClass('col-' + head.get('name'));
			
		},
		renderToParent:function(){
			
		},
		selected:function(e){
			var state = this.model.get('_selected');
			if(!state && !$(e.target).is('input,a') && !this.view.selector){
				this.view.collection.each(function(model){
					model.set({_selected:false});
				},this);
			}
			this.model.set({_selected:!state});
		},
		setSelected:function(){
			if(this.model.get('_selected')){
				this.$el.addClass('selected')
				.data('selected',true)
				.find('input')
				.attr('checked','checked');
			}else{
				this.$el.removeClass('selected')
				.data('selected',false)
				.find('input')
				.removeAttr('checked');
			}
		},
		onClick:function(e){
			var $t = $(e.target);

			if(this.view.model.get('mode') === 'tree' && $t.is('em')){
				if($t.hasClass('open')){
					this.view.$('.row-parent-' + this.model.get(this.view.idName)).trigger('close');
					$t.removeClass('open');
				}else{
					$t.addClass('open');
					this.view.$('.row-parent-' + this.model.get(this.view.idName)).show();
				}
				this.view.body.setHeadWidth();
			}else if(this.view.model.get('mode') === 'list' && this.view.model.get('param').pagination === 'node' && $t.is('.J-cell-title')){
				this.view.nodeNav(this.model.get(this.view.idName));
			}else if(!this.view.model.get('notSelected')){
				this.selected(e);
			}
		},
		onClose:function(){
			this.view.$('.row-parent-' + this.model.get(this.view.idName)).trigger('close');
			this.$('em').removeClass('open');
			this.$el.hide();
		},
		minute:function(e){
			minute.apply(this);
			e.stopPropagation();
			e.preventDefault();
		},
		update:function(){
			//this.render();
		}
	});
	
	//网格行定义
	Row.Grid = Row.Base.extend({
		tagName:'li',
		container:'div'
	});
	
	//表格行定义
	Row.Table = Row.Base.extend({
		tagName:'tr',
		container:'td'
	});
	
	//编辑行定义
	Row.Edit = Row.Base.extend({
		tagName:'tr',
		container:'td',
		cellType:'Edit',
		initialize:function(){
			Row.Base.prototype.initialize.apply(this, arguments);
			this.model.on('change',this.onChange,this);
			this.$el.on('contextmenu',$.proxy(this.context,this));
			this.hasHide = true;
		},
		onChange:function(attr){
			if(this.model.toJSON()){
				this.view.collection.add(this.model);
				if(this.$el.parent().find('tr').size() 
				<= this.$el.parent().find('tr').index(this.$el) + 1){
					this.view.body.addRow();
				}
			}
		},
		context:function(e){
			var $context = $('<ul class="dropdown-menu"></ul>');
			var onContext = function(e){
				var $el = $(e.target);
				if($el.data('action') === 'remove'){
					this.view.collection.remove(this.model);
					if(this.model.get(this.view.idName)){
						this.view.removeCollection.add(this.model);
					}
					this.remove();
				}else if($el.data('action') === 'upAdd'){
					this.view.body.addRow(this,'before');
				}else if($el.data('action') === 'downAdd'){
					this.view.body.addRow(this,'after');
				}
				$context.remove();
			};
			
			$context.append('<li><a href="javascript:void(0);" data-action="remove">删除行</a></li>');
			$context.append('<li><a href="javascript:void(0);" data-action="upAdd">上面添加行</a></li>');
			$context.append('<li><a href="javascript:void(0);" data-action="downAdd">下面添加行</a></li>');
			var $t = $(e.target);
			var $body = this.view.$('.view-content-body');
			$context.css({
				top:$t.offset().top - $body.offset().top + $body.scrollTop() + e.offsetY,
				left:$t.offset().left - $body.offset().left + e.offsetX,
				display:'block'
			});
			this.view.editor.$el.append($context);
			$context.on('mousedown', 'li>a', $.proxy(onContext,this));
			e.preventDefault();
			$(document).on('mousedown',function(e){
				$context.remove();
				$(document).unbind(e);
			});
		}
	});
	
	//网盘行定义
	Row.Disk = Row.Base.extend({
		tagName:'li',
		className:'fn-clear',
		container:'div',
		events:{
			'click':'onClick',
			'close':'onClose'
		},
		render:function(){
			var filter = require('../base/filter');
			var html = this.isHead ? 
			'<div class="fn-left col-title" style="width:64%;">'
			+'<span class="fn-iblock" style="width:30px;height:24px;text-align:center; padding-top:10px;line-height:1em;" class="col-NODE_KEY"><input type="checkbox"></span>'
			+'<span class="fn-iblock" style="width:34px;height:34px;margin-right:5px;">&nbsp;</span>'
			+'<span class="fn-iblock" style="font-size:13px;"><%=NODE_NAME%></span></div>'
			+ '<div class="fn-left col-UPDATE_TIME" style="width:18%;"><span><%=UPDATE_TIME%></span></div>'
			+'<div class="fn-left col-FILE_SIZE" style="width:18%;"><span><%=FILE_SIZE%></span></div>'
			:
			'<div class="fn-left col-title" style="width:64%;">'
			+'<span class="fn-iblock" style="width:30px;height:24px;text-align:center; padding-top:10px;line-height:1em;" class="col-NODE_KEY"><input type="checkbox"></span>'
			+'<span class="fn-iblock file-icon-small" style="width:34px;height:34px;margin-right:5px;">&nbsp;</span>'
			+'<span class="fn-iblock" style="font-size:13px;"><a href="javascript:void(0);" class="J-cell-title"><%=NODE_NAME%></a></span></div>'
			+ '<div class="fn-left col-UPDATE_TIME" style="width:18%;"><span><%=UPDATE_TIME%></span></div>'
			+'<div class="fn-left col-FILE_SIZE" style="width:18%;"><span><%=FILE_SIZE%></span></div>';
			var object = this.model.toJSON();
			object.UPDATE_TIME = filter.time(object.UPDATE_TIME);
			object.FILE_SIZE = filter.byte(object.FILE_SIZE);
			this.$el.html(_.template(html,object));
			
			var securitys = {
				none:1,
				read:2,
				download:3,
				edit:4,
				share:5,
				admin:6
			};
			
			this._security = object._security 
			? object._security
			: this.model.get('NODE_TYPE') === 'catalog'
				? object._security
				: this.view.model.get('data').node.security;
			
			//权限处理
			if(!this._security || this._security === '1'){
				if(this.model.get('NODE_TYPE') !== 'catalog'){
					this.$('.J-cell-title').parent().empty()
					.append('<span>'+ this.model.get('NODE_NAME') +'</span>');
				}
				this.$el.addClass('disabled');
				this.$('input[type=checkbox]').attr('disabled','disabled');
			}
			
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
			
			if(this.model.get('NODE_TYPE') === 'catalog'){
				this.$('.file-icon-small').addClass('file-icon-folder');
			}else if(this.model.get('NODE_TYPE') === 'file' && file_types[t]){
				this.$('.file-icon-small').addClass(file_types[t]);
			}else if(this.model.get('NODE_TYPE') === 'custom' && file_types[this.model.get('FILE_TYPE')]){
				this.$('.file-icon-small').addClass(file_types[this.model.get('FILE_TYPE')]);
			}else{
				this.$('.file-icon-small').addClass('file-icon-other');
			}
			
			if(this.model.get('NODE_NAME') === '导航视图'){
				setTimeout($.proxy(function(){
					this.$('.J-cell-title').click();
				},this),30);
			}
			
			return this;
		},
		onClick:function(e){
			var $t = $(e.target);
			//var v;
			if($t.is('.J-cell-title')){
				if(this.model.get('NODE_TYPE') === 'catalog'){
					this.view.nodeNav(this.model.get(this.view.idName));
				}else if(this.model.get('NODE_TYPE') === 'file'){
					if(this.model.get('FILE_TYPE') && this.model.get('FILE_TYPE').indexOf('image') !== -1){
						this.preview();
					}else{
						this.download();
					}
					
				}else if(this.model.get('NODE_TYPE') === 'custom'){
					this.preview();
				}else if(this.model.get('NODE_TYPE') === 'view'){
					
				}
			}else if(!this.view.model.get('notSelected')){
				if(this.$el.hasClass('disabled')){
					return;
				}
				this.selected(e);
			}
		},
		download:function(){
			var security = this.model.get('_security');
			security = security ? security : this.view.model.get('data').node.security;
			if(!security || security < 3){
				alert('无选定文件下载权限');
				return;
			}
			window.location =
				GBROS.path + "/file?_node=" 
				+ this.model.get(this.view.model.get('attr').idName);
		},
		preview:function(){
			var view = COMS.view;
			var v = new view.Preview({
				model:this.model,
				main:this.view
			});
			v.render();
		}
	});
	
	var List = Backbone.View.extend({
		initialize:function(){
			this.view = this.options.view;
			this.$bodyContainer = $(this.bodyContainer);
			this.$headContainer = $(this.headContainer);
			this.parent = null;
			this.titleName = this.view.headCollection.findWhere({isTitle:true}) 
			&& this.view.headCollection.findWhere({isTitle:true}).get('name');
		},
		render:function(){
			this.$el.html(this.$headContainer);
			this.$el.append(this.$bodyContainer);
			this.collection.each(this.renderBodyRow,this);
			this.$('.row-parent').not('.row-child').last().addClass('end');
			this.readerHeadRow();
			return this;	
		},
		readerHeadRow:function(){
			var row;
			var object = {};
			var head = this.view.headCollection.toJSON();
			for(var i = 0; i < head.length; i++){
				object[head[i]['name']] = head[i]['alias']?head[i]['alias']:head[i]['name'];
			}
			var model = new Backbone.Model(object);
			this.head = new Row[this.rowType]({model:model,view:this.view,isHead:true});
			this.$headContainer.append(this.head.render().el);
		},
		renderBodyRow:function(model,i,list,parent){
			var row = new Row[this.rowType]({
				model:model,
				view:this.view,
				parent:parent,
				id:'row-' + model.get(this.view.idName)
			});
			this.$bodyContainer.append(row.render().el);
			//是否为子节点
			if(parent){
				row.$el.addClass('row-child');
				row.$el.addClass('row-parent-' + parent.id);
				row.$('.col-' + this.titleName).css('padding-left',18 * (parent.level+1) + 8)
				.prepend('<em class="fn-iblock">&nbsp;</em>');
				this.view.collection.add(model);
			}
			
			//是否有子节点
			if(model.get('_childList')){
				var object = {
					id:model.get(this.view.idName),
					level: parent ? parent.level + 1 : 0
				};
				this.renderChildRow(model.get('_childList'),object);
				!parent && row.$('.col-' + this.titleName).prepend('<em class="fn-iblock">&nbsp;</em>');
				row.$el.addClass('row-parent');
				row.$('.col-' + this.titleName).append(' (' + this.$('.row-parent-' + model.get(this.view.idName)).size() + ')');
				this.$('.row-parent-' + model.get(this.view.idName)).last().addClass('end');
			}
		},
		renderChildRow:function(childList,parent){
			var coll = new Backbone.Collection(childList);
			for(var i = 0; i < coll.length; i++){
				this.renderBodyRow(coll.at(i),i,null,parent);
			}
		}
	});

	var compontent = {
		
		//面包屑组件
		Breadcrumb:Backbone.View.extend({
			tagName:'ul',
			className:'fn-ul-iblock',
			initialize:function(){
				this.view = this.options.view;
			},
			render:function(){
				this.collection.each(this.renderItem,this);
				return this;	
			},
			renderItem:function(model,i,context){
				var v = new BreadcrumbItem({
					model:model,
					view:this.view,
					tpl:this.options.tpl
				});
				if(i > 0){
					this.$el.append('<li class="fix">></li>');
				}
				this.$el.append(v.render().el);
			}
		}),
		
		//动作组件
		Action:Backbone.View.extend({
			tagName:'div',
			initialize:function(){
				this.view = this.options.view;
			},
			render:function(){
				this.$el.append($('#tpl-view-action-group').html());
				this.collection.each(this.renderItem,this);
				return this;	
			},
			renderItem:function(model,i){
				var v = new ActionItem({
					model:model,
					view:this.view,
					id:'act-' + model.get('id')
				});
				
				if(model.get('group') && i > 0){
					this.$el.append($('#tpl-view-action-group').html());
					this.$el.find('.btn-group').append();
				}
				this.$el.find('.btn-group:last').append(v.render().el);
			}
		}),
		
		//视图过滤器组件
		Filter:Backbone.View.extend({
			tagName:'div',
			className:'form-filter',
			initialize:function(){
				this.view = this.options.view;
			},
			render:function(){
				this.collection.each(this.renderItem,this);
				return this;	
			},
			renderItem:function(model,i){
				var v;
				if(model.get('form') === 'treeFilter'){
					v = new FilterTreeItem({
						model:model,
						view:this.view
					});
					v.render();
				}else{
					v = new FilterItem({
						model:model,
						view:this.view
					});
					this.$el.append(v.render().el);
				}
			}
		}),
		
		//导航选项卡组件
		Tab:Backbone.View.extend({
			tagName:'ul',
			className:'nav nav-pills',
			initialize:function(){
				this.view = this.options.view;
			},
			render:function(){
				this.collection.each(this.renderItem,this);
				return this;	
			},
			renderItem:function(model,i){
				var v = new TabItem({
					model:model,
					view:this.view
				});
				this.$el.append(v.render().el);
			}
		}),
		
		//设置组件
		Setting:Backbone.View.extend({
			tagName:'div',
			initialize:function(){
				this.view = this.options.view;
			},
			render:function(){
				return this;	
			}
		}),
		
		//分页组件
		Pagination:Backbone.View.extend({
			tagName:'ul',
			initialize:function(){
				this.view = this.options.view;
			},
			render:function(){
				var size = 8;
				var s,lt,rt;
				
				if(this.model.get('pageCount') > size){
					s = Math.floor(size/2);
					rt = this.model.get('page') + s;
					rt = rt > this.model.get('pageCount') ? this.model.get('pageCount') : rt;
					lt = rt - size + 1;
					lt = lt < 1 ? 1:lt;
				}else{
					size = this.model.get('pageCount');
					lt = 1;
				}
				
				if(this.model.get('pageCount') > 1){
					for(var i = lt; i < lt + size; i++){
						this.renderItem(new Backbone.Model({no:i,title:i}),i);
					}
				}
				
				//上一页
				
				//下一页
				
				//首页
				
				//尾页
				
				return this;
			},
			renderItem:function(model,i){
				var v = new PaginationItem({
					model:model,
					view:this.view
				});
				this.$el.append(v.render().el);
			}
		}),
		//排序组件
		Sort:Backbone.View.extend({
			tagName:'div',
			initialize:function(){
				this.view = this.options.view;
			}
		}),
		//网格组件
		Grid:List.extend({
			tagName:'div',
			bodyContainer:'<ul class="content-body"></ul>',
			headContainer:'<ul class="content-header"></ul>',
			rowType:'Grid'
		}),
		
		//表格组件
		Table:List.extend({
			tagName:'table',
			className:'table table-hover table-hide-header',
			bodyContainer:'<tbody></tbody>',
			headContainer:'<thead></thead>',
			rowType:'Table',
			copyHead:function(){
				this.fixedHead = new Backbone.View({
					tagName:'table',
					className:this.className
				});
				
				this.fixedHead.$el.removeClass('table-hide-header');
				
				//复制内容头部定义
				this.fixedHead.$el.html(this.$headContainer.clone());
				var that = this;
				
				//设置克隆头部宽度
				/*
				var setWidth = function(){
					table.$el.width(that.$el.width());
					that.$el.css('margin-top',- that.$headContainer.height() - 1);
					table.$el.find('td,th').each(function(i,e){
						var $e = $(e);
						$e.width(
							that.$headContainer.find('.'+$e.attr('class')).width()
						);
					});
				};*/

				this.setHeadWidth();
				
				//监听浏览器缩放窗口事件，实时更新宽度
				$(window).resize(function(e) {
					that.setHeadWidth();
				});
				return this.fixedHead;
			},
			setHeadWidth:function(){
				this.fixedHead.$el.width(this.$el.width() + 1);
				this.$el.css('margin-top', - this.$headContainer.height() - 1);
				var that = this;
				this.fixedHead.$el.find('td,th').each(function(i,e){
					var $e = $(e);
					$e.width(
						that.$headContainer.find('.'+$e.attr('class')).width()
					);
				});
			}
		})
	};
	
	//网盘视图
	compontent.Disk = compontent.Grid.extend({
		className:'content-disk',
		rowType:'Disk',
		copyHead:function(){
			this.fixedHead = new Backbone.View;
			this.fixedHead.$el.html(this.$headContainer.clone());
			this.setHeadWidth();
			this.$headContainer.hide();
			return this.fixedHead;
		},
		setHeadWidth:function(){
			this.fixedHead.$el.width(this.$el.width());
		}
	});
	
	//编辑表格
	compontent.EditTable = compontent.Table.extend({
		className:'table table-bordered table-hide-header',
		rowType:'Edit',
		render:function(){
			compontent.Table.prototype.render.apply(this, arguments);
			//if(this.view.mainView.model.get('mode') !== 'tree'){
				this.head.$('td').width(100/this.head.colNum + '%');
			//}
			this.renderEmptyRow();
			return this;
		},
		addRow:function(row,type){ //添加行
			var r;
			r = new Row[this.rowType]({
				model:new Backbone.Model,view:this.view,isEmpty:true
			});
			row || this.$bodyContainer.append(r.render().el);
			row && type === 'after' && row.$el.after(r.render().el);
			row && type === 'before' && row.$el.before(r.render().el);
		},
		removeRow:function(){ //移除行
			
		},
		renderEmptyRow:function(){ //渲染编辑行
			var len = this.view.rowNum - this.collection.length;
			do{
				this.addRow();
				len--;
			}while(len > 0);
		}
	});
	
	compontent.DetailContent = Backbone.View.extend({
		className:'view-content-body form-group',
		initialize:function(){
			this.view = this.options.view;
		},
		render:function(){
			var head = this.view.mainView.model.get('attr').head;
			var row = this.model.toJSON();
			for(var i = 0; i < head.length; i++){
				if(this.view.mainView.idName !== head[i]['name']){
					this.renderCell(head[i],row[head[i]['name']]);
						//this.$el.append('<div class="tr"><label class="t fn-iblock" style="width:180px;">' + head[i]['alias'] + '</label><span class="control fn-iblock">'+ row[head[i]['name']] +'</span></div>');
				}
			}
			return this;
		},
		renderCell:function(head,model){
			head = new Backbone.Model(head);
			model = filter[head.get('metaType')] ? filter[head.get('metaType')](model) : model;
			model = new Backbone.Model({name:model});
			var tpl = '<div class="tr"><label class="t fn-iblock" style="width:180px;"><%=alias%></label><span class="control fn-iblock"><%=value%></span></div>';
			var cell = new Cell.Base({
				row:this,
				model:model,
				head:head
			}).render();
			this.$el.append(_.template(tpl,{
				alias:head.get('alias'),
				value:cell.model.get('name')
			}));
		}
	});
	
	return compontent;
});