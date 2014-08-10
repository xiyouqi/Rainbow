define(function(require){
	var aid = {
		//预览视图
		Preview:Backbone.View.extend({
			tagName:'div',
			className:'',
			initialize:function(){
				
			},
			render:function(){
				return this;	
			}
		}),
		//弹出层视图
		Dialog:Backbone.View.extend({
			tagName:'div',
			className:'',
			initialize:function(){
				
			},
			render:function(){
				return this;	
			}
		})
	};
	return aid;
});