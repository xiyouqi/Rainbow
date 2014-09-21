define(function(require){
	return {
		load:function(user){
			$.getScript('http://' + location.hostname + ':1337/js/dependencies/sails.io.js',function(){
				var socket = io.connect('http://' + location.hostname + ':1337');
				var user_id = user.userKey;
				var $notice = $('#J-notice');
				var messages = [];
				
				var Item = Backbone.View.extend({
					className:'media',
					render:function(){
						this.$el.html(_.template(
							$('#tpl-view-notice-item').html(),this.model.toJSON()
						));
						return this;
					},
					read:function(){
						$.ajax({
					    url: 'http://' + location.hostname + ':1337/message/read?id=' + this.model.get('id'),
					    jsonp: "callback",
					    dataType: "jsonp",
					    success: function(data) {
								
					    }
						});
					}
				});
				
				var loadMessage = function(){
					$.ajax({
				    url: 'http://' + location.hostname + ':1337/message/jsonp?user_id=' + user_id,
				    jsonp: "callback",
				    dataType: "jsonp",
				    success: function( response ) {
				        messages = response;
				        $notice.find('span').remove();
				        $notice.append('<span class="badge badge-important">' + response.length + '</span>');
				    }
					});
				};
				
				loadMessage();
				
				$notice.on('click',function(){
		  		$notice.find('span').remove();
		  		var $f = $('<div class="form-group modal hide fade in"></div>').html($('#tpl-view-notice').html());
					$f.attr({
						//tabindex:"-1",
						role:"dialog",
						"aria-labelledby":"myModalLabel",
						"aria-hidden":"true"	
					});
					
					$f.modal({
					  keyboard: false
					});
					
					for(var i = 0; i < messages.length; i++){
						var item = new Item({model:new Backbone.Model(messages[i])});
						$f.find('.modal-body').append(item.render().el);
					}
					
					$f.on('hidden', function () {
						$f.remove();
					});
					
		  	});
		  	
				socket.on('connect',function(){
				  socket.get('/notice',{user_id:user_id},function(users){
				    
				  });
				  
				  socket.on('notice',function(e){
				  	//播放声音
				  	soundManager.setup({
						  url: '/Rainbow/lib/soundmanager/swf/',
						  onready: function() {
						    var mySound = soundManager.createSound({
						      id: 'aSound',
						      url: '/Rainbow/lib/soundmanager/mp3/notification.mp3'
						    });
						    mySound.play();
						  },
						  ontimeout: function() {
						  
						  }
						});
						
						loadMessage();
						
				  });
				});
				
				socket.on('disconnect', function(e){
					
				});
			});
		}
	};
});