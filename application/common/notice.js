define(function(require){
	var filter = require('../base/filter');
	return {
		load:function(user){
			$.getScript('http://' + location.hostname + ':1337/js/dependencies/sails.io.js',function(){
				var socket = io.connect('http://' + location.hostname + ':1337');
				var user_id = user.userKey;
				var $notice = $('#J-notice');
				var messages = [];
				
				var Item = Backbone.View.extend({
					className:'media',
					events:{
						'click':'onClick'
					},
					render:function(){
						this.model.set('send_time',filter.time(this.model.get('send_time')));
						this.$el.html(_.template(
							$('#tpl-view-notice-item').html(),this.model.toJSON()
						));
						return this;
					},
					onClick:function(e){
						this.read();
						this.model.get('url') && window.open('http://' + location.host + '/' + this.model.get('app_id') + '#!' + this.model.get('url'));
					},
					read:function(){
						var that = this;
						$.ajax({
					    url: 'http://' + location.hostname + ':1337/message/read/' + this.model.get('id'),
					    jsonp: "callback",
					    dataType: "jsonp",
					    success: function(data) {
								that.remove();
								loadMessage();
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
				        response.length > 0 && $notice.append('<span class="badge badge-important">' + response.length + '</span>');
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
					
					$f.find('.J-read').on('click',function(){
						$.ajax({
					    url: 'http://' + location.hostname + ':1337/message/read/?user_id=' + user_id,
					    jsonp: "callback",
					    dataType: "jsonp",
					    success: function(data) {
								$f.find('.modal-body').empty();
								loadMessage();
					    }
						});
					});
					
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