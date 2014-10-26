define(function(require){
	var formUI = require('../ui/form');
	var timeFilter = require('../base/filter');
	var Item = Backbone.View.extend({
		tagName:'div',
		className:'tr',
		events:{
			'change input,textarea,select':'onChange',
			'change input[type=file]':'onFileChange',
			'blur input,textarea,select':'onChange'
		},
		initialize:function(){
			this.form = this.options.form;
			this.form.on('verify',this.verify,this);
		},
		render:function(){
			this.$el.html(_.template($('#tpl-form-item').html(),this.model.toJSON()));
			
			if(this.model.get('form') === 'file' && this.form.model.get(this.model.get('name'))){
				var a = '<span>已上传[<a href="'+GBROS.path
				+'/sysfile?_node='+this.form.model.get(this.model.get('name'))+'" target="_blank">打开</a>]</span>';
				this.$('.control').append(a);
			}
			
			this.control = formUI.control(this.model,this.form.model.get(this.model.get('name')));
			
			this.$('.control').append(this.control);
			
			if(!this.model.get('required')){
				this.$('em').hide();
			}
			if(this.model.get('metaType') === 'date' || this.model.get('metaType') === 'time'){
				this.timeFilter();
			}
			
			if(this.model.get('form') === 'chosen'){
				this.$(".chosen-select").css('width',300).select2();
			}
			
			if(this.model.get('form') === 'editor'){
				this.control.hide().css('height',300).css('width',450);
				var that = this;
				setTimeout(function(){
					that.editor = KindEditor.create('textarea[name="' + that.model.get('name') + '"]', {
						resizeType : 1,
						minWidth:'450px',
						allowPreviewEmoticons : false,
						allowImageUpload : false,
						items : [
							'fontname', 'fontsize', '|', 'forecolor', 'hilitecolor', 'bold', 'italic', 'underline',
							'removeformat', '|', 'justifyleft', 'justifycenter', 'justifyright', 'insertorderedlist',
							'insertunorderedlist', '|', 'emoticons', 'image', 'link']
					});
				},200);
			}
			
			return this;	
		},
		getVal:function(el){
			this.editor && this.editor.sync();
			return formUI.getVal(el);
		},
		timeFilter:function(){
			var $input = this.$('input');
			if(this.model.get('metaType') === 'date'){
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
			
			if(this.model.get('metaType') === 'time'){
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
		verify:function(el){
			$el = el ? $(el) : this.$('input,select,textarea');
			$(el).removeClass('error');
			//var val = this.getVal($el);
			var val = this.getVal(this.control);
			val = (val === undefined) ? '' : val;
			this.$('.remind').empty();
			var result = formUI.verify(this.model,val);
			if(result){
				$el.addClass('error');
				this.$('.remind').html(result);
			}else{
				this.form.model.set(this.model.get('name'),val);
			}
		},
		onChange:function(e){
			this.verify(e.target);
		},
		onFileChange:function(e){
			var $formIframe = $('<iframe id="_uploadiFrame" name="_uploadiFrame" style="display:none;"></iframe>');
			var $form = $('<form class="hidden"></form>');
			var $input = this.$('input');
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
				}else if(data[that.model.get('name')]){
					that.control = $('<input type="hidden" name="'+that.model.get('name')+'">');
					that.control.val(data[that.model.get('name')]);
					var a = '<span>已上传[<a href="'+GBROS.path
					+'/sysfile?_node='+data[that.model.get('name')]
					+'" target="_blank">打开</a>]</span>';
					that.$('.control').empty().append(a).append(that.control);
				}else{
					alert('服务器异常：'+data);
				}
			};
			$form.attr('enctype','multipart/form-data');
			$form.attr('action',GBROS.actionPath + this.form.action.model.get('id'));
			$form.attr('target','_uploadiFrame');
			$form.attr('method','post');
			$form.submit();
		}
	});
	
	var Form = Backbone.View.extend({
		tagName:'form',
		className:'form-group',
		events:{
			'submit':'onSubmit',
			'click .J-submit:not(.disabled)':'onSubmit'
		},
		attributes:{
			'method':'post'
		},
		initialize:function(){
			this.action = this.options.action;
			this.callBack = this.options.callBack;
			this.queue = require('../ajax/queue')();
			this.data = null;
			this.tpl = this.options.tpl ? this.options.tpl : $('#tpl-view-form-modal').html();
		},
		render:function(){
			var html = this.options.modal === true ? this.tpl : $('#tpl-view-form').html();
			this.$el.html(_.template(html,this.action.model.toJSON()));
			this.collection && this.collection.each(this.renderItem,this);
			return this;	
		},
		renderItem:function(model,i){
			var v = new Item({
				model:model,
				form:this
			});
			this.$('.modal-body').append(v.render().el);
		},
		disableSubmit:function(){
			this.$('.J-submit').addClass('disabled');
			return this;
		},
		enableSubmit:function(){
			this.$('.J-submit').removeClass('disabled');
			return this;
		},
		commit:function(){
			this.queue.add(
				this.action.model.get('id'),
				this.action.getUrl(),
				{
					context:this,
					data:this.data,
					ok:function(data){
						alert(data.ok);
						this.action.view.model.request();
						if(this.options.modal) {
							this.$el.modal('hide');
						}
					},
					err:function(msg,remind){
						this.enableSubmit();
						remind || alert(msg);
					}
				}
			);
			this.queue.execute(this.action.model.get('id'));
		},
		onSubmit:function(e){
			e.preventDefault();
			this.trigger('verify');
			if(this.$('.error').size() > 0){
				alert('正确填写错误项后才可以提交');
				return;
			}
			this.disableSubmit();
			var data = this.model.toJSON();
			if(this.callBack){
				this.callBack(data,this);
				return;
			}
			var object = {};
			object['save'] = $.isArray(data) ? data : [data];
			if(this.action.view.model.get('mode') === 'list'
			&& this.action.view.model.get('param').pagination === 'node'){
				object.node = this.action.view.model.get('data').node.id;
			}
			this.data = {_data:JSON.stringify(object)};
			this.commit();
		},
		destroy:function(){
			this.queue.remove(this.action.model.get('id'));
			this.remove();
		}
	});
		
	var DetailForm = Backbone.View.extend({
		tagName:'div',
		className:'form-detail',
		events:{
			
		},
		initialize:function(){
			
		},
		render:function(){
			return this;	
		}
	});
	
	var UploadForm = Form.extend({
		render:function(){
			this.$el.html(_.template($('#tpl-view-upload-form').html(),this.action.model.toJSON()));
			var that = this;
			that.$('.modal-body').append('<ol></ol>');
			that.$el.appendTo('body').hide();
			var fileList = function(file){
				that.$('.modal-body tbody').append(_.template($('#tpl-file-list').html(),file));
			};
			
			var fileDialogComplete = function(sNum,qNum,tNum){
				if(tNum > 0){
					that.$('.J-submit').removeClass('disabled');
				}
			};
			
			var uploadProgress = function(file,complete,total){
				var num = (complete/total*100).toFixed(0) + '%';
				$('#file-' + file.id + ' .bar').width(num).text(num);
			};
			
			var uploadError = function(file,code,message){
				$('#file-' + file.id + ' .state').html('上传失败');
			};
			
			var uploadComplete = function(file){
				//$('#file-' + file.id + ' .state').html('完成 (' + file.filestatus + ')');
				$('#file-' + file.id + ' .state').html('完成 ');
				if(this.getStats().files_queued < 1){
					that.complete();
				}else{
					this.startUpload();
				}
			};
			
			var nodeId = this.action.view.model.get('data').node
						? this.action.view.model.get('data').node.id : '';
							
			var settings_object = {
				upload_url : GBROS.path + "/UpLoadServlet",
				flash_url : GBROS.path + "/Rainbow/lib/SWFUpload/Flash/swfupload.swf",
				file_post_name : "Filedata",
				post_params : {
				   "_node" : nodeId
				},
				use_query_string : false,
				requeue_on_error : false,
				http_success : [201, 202],
				assume_success_timeout : 0,
				file_types : "*.*",
				file_types_description: "所有文件",
				file_size_limit : "256MB",
				//file_upload_limit : 10,
				//file_queue_limit : 2,
	 
				debug : false,
		 		prevent_swf_caching : false,
				preserve_relative_urls : false,
		 
				button_placeholder:this.$('.J-select').get(0),
				//button_image_url : "http://www.swfupload.org/button_sprite.png",
				button_width : 50,
				button_height : 22,
				button_text : '<span class="redText">添加文件</span>',
				button_text_style : ".redText {color:#009966;}",
				//button_text_left_padding : 3,
				button_text_top_padding : 2,
				button_action : SWFUpload.BUTTON_ACTION.SELECT_FILES,
				button_disabled : false,
				file_dialog_complete_handler : fileDialogComplete,
				upload_progress_handler : uploadProgress,
				upload_complete_handler : uploadComplete,
				upload_error_handler : uploadError,
				file_queued_handler : fileList,
				button_cursor : SWFUpload.CURSOR.HAND,
				button_window_mode : SWFUpload.WINDOW_MODE.TRANSPARENT
				/*swfupload_loaded_handler : swfupload_loaded_function,
				file_dialog_start_handler : file_dialog_start_function,
				file_queued_handler : file_queued_function,
				file_queue_error_handler : file_queue_error_function,
				file_dialog_complete_handler : file_dialog_complete_function,
				upload_start_handler : upload_start_function,
				
				upload_error_handler : upload_error_function,
				upload_success_handler : upload_success_function,
				upload_complete_handler : upload_complete_function,
				debug_handler : debug_function,*/
			};
			
			 
			this.swfUpload = new SWFUpload(settings_object);
			this.$('.J-submit').addClass('disabled');
			return this;	
		},
		onSubmit:function(){
			if(this.swfUpload.getStats().files_queued < 1){
				alert('请先选择文件');
				return false;
			}
			this.swfUpload.startUpload();
			//this.swfUpload.setButtonDisabled(true);
			return false;
		},
		complete:function(){
			this.action.view.model.request();
			if(this.options.modal) {
				this.$el.modal('hide');
			}
		},
		destroy:function(){
			this.swfUpload.destroy();
			this.remove();
		}
	});
	
	var StepForm = Backbone.View.extend({
		tagName:'form',
		className:'',
		initialize:function(){
			
		},
		render:function(){
			return this;	
		}
	});
	
	var form = {
		Form:Form,
		DetailFrom:DetailForm,
		UploadForm:UploadForm,
		StepForm:StepForm
	};
	return form;
});