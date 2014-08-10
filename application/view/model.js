define(function(require){
	var view = COMS.view;
	var showView = function(model){
		if(model.get('autoView')){
			model.view = new view.General({
				model:model,
				id:'view-' + model.id,
				isNav:true
			});
			model.view.render();
		}else if(model.get('event')){
			var ext = require('../extend/view');
			if(ext[model.get('event')]){
				ext[model.get('event')](model);
			}else{
				alert('视图事件定义错误');
			}
		}
	};
	
	var Model = Backbone.Model.extend({
		initialize:function(){
			this.filterModel = new Backbone.Model;
			this.settingModel = new Backbone.Model(this.get('setting'));
			this.filterModel.on('change', this.request, this);
			this.hasView = false;
		},
		idAttribute: "id",
		setCallBack:function(fn){
			this.callBack = fn;
		},
		request:function(){
			this.view && this.view.$('.loading-sharp').fadeIn("slow");
			var success = function(model, data){
				if(data.error){
					alert(data.error);
				}else if(data.unlogin){
					delete model;
					GBROS.logout();
				}else{
					if(!model.view && model.callBack){
						model.callBack();
					}else if(!model.view){
						showView(model);
						model.filterModel.set({_hasHead:'none'},{silent: true});
					}else{
						model.view.$('.loading-sharp').fadeOut("slow");
					}
				}
			};
			
			var error = function(model){
				if(confirm('访问服务器失败，是否重试?')){
					model.request();
				}
			};
			
			this.fetch({
				success:success,
				error:error,
				data:_.extend(
					this.filterModel.toJSON(),
					{_time:new Date().getTime()}
				)
			});
		}
	});
	
	return Model;
});