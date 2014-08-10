define(function(require){
	var cookie = require('./common/cookie');
	
	//定义登录框视图
	var LoginBox = Backbone.View.extend({
		id:'login-box',
		events:{
			'click .btn':'submit',
			'submit form':'submit'
		},
		render:function(){
			this.$el.html(_.template($('#tpl-login-box').html()));
			this.$('input[name=userId]').val(cookie.get('userId'));
		},
		submit:function(){
			var $userId = this.$('input[name=userId]');
			var $password = this.$('input[name=password]');
			var data = {userId:$userId.val(),password:$password.val(),appId:this.options.appId};
			$.ajax(this.options.url,{
				type:'post',
				context:this,
				data:data,
				dataType:'json',
				success:function(data,textStatus,jqXHR){
					if(data.error){
						alert(data.error);
						return false;
					}else if(data.ok){
						this.$el.fadeOut("slow");
						$password.val('');
						this.options.success();
					}else{
						alert('服务器异常：'+data);
						return false;
					}
				},
				error:function(){
					if(confirm('访问服务器失败，是否重试?')){
						this.submit();
					}else{
						return false;
					}
				}
			});
			return false;
		},
		initialize: function(a) {
			this.render();
		}
	});
	
	var session = {
		logout:function(url,success){
			$.ajax(
				url,
				{
					dataType:'json',
					success:function(data,textStatus,jqXHR){
						if(data.error){
							alert(data.error);
						}else if(data.ok){
							success();
						}else{
							alert('服务器异常：'+data);
						}
					},
					error:function(){
						alert('访问服务器失败');
					}
				}
			);
			return false;
		},
		LoginBox:LoginBox
	};
	return session;
});