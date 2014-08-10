define(function(require){
	var queue = {};
	var ajaxQueue = function(){
		return {
			add:function(id,url,option){
				option.type = option.type ? option.type : 'post';
				option.dataType = option.dataType ? option.dataType : 'json';
				//option.contentType = 'multipart/form-data; charset=UTF-8';
				var success = function(data,textStatus,jqXHR){
					if(queue[id]){
						if(data.error){
							option.err.apply(option.context,[data.error]);
						}else if(data.unlogin){
							option.err.apply(option.context,['登录超时']);
							GBROS.logout();
						}else if(data.ok){
							option.ok.apply(option.context,[data]);
						}else{
							option.err.apply(option.context,['服务器异常：'+data]);
						}
						
						delete queue[id];
					}
				};
				
				var error = function(){
					if(queue[id]){
						if(confirm('访问服务器失败，是否重试?')){
							$.ajax(queue[id].url,queue[id].option);
						}else{
							option.err.apply(option.context,['访问服务器失败',true]);
							delete queue[id];
						}
					}
				};
				
				option.success = success;
				option.error = error;
				queue[id] = {url:url,option:option};
			},
			execute:function(id){
				$.ajax(queue[id].url,queue[id].option);
			},
			remove:function(id){
				delete queue[id];
			}
		};
	};
	
	return ajaxQueue;
});