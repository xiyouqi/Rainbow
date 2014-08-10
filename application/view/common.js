define(function(require){
	var compontent = require('./compontent');
	var setHeight = function(){
		$('.view-content-body').height($(window).innerHeight() - $('#header').outerHeight() - $('.view-header').outerHeight() - $('.view-content-header').outerHeight() - $('.view-footer').outerHeight());
	}
	
	//基础视图定义
	var Base = Backbone.View.extend({
		tagName:'div',
		className:'view-container'
	});
	
	var Common = Base.extend({
		initialize:function(){
			this.headCollection = new Backbone.Collection(this.model.get('data').common.head);
			this.collection = new Backbone.Collection;
			this.model.on('change',this.update,this);
			this.collection.on('change:_selected',this.selected,this);
		},
		render:function(){
			$('#J-view').empty();
			$('#J-view').append(this.el);
			this.$el.append($('#tpl-view-list-layout').html());
			
			//载入视图组件
			//Action
			this.action();
			
			//Breadcrumb
			this.breadcrumb();
			
			if(this.model.get('type') === 'list'){
				//Pagination
				this.model.filterModel.set({_page:1,_pagesize:10},{silent: true});
			}
			
			//Content
			this.update();
			
            setHeight();
            $(window).resize(function(e) {
                setHeight();
            });
			return this;	
		},
		breadcrumb:function(){
			var view = new compontent.Breadcrumb({
				collection:new Backbone.Collection(this.model.get('breadcrumb')),
				view:this
			});
			this.$('.J-view-breadcrumb').html(view.render().el);
		},
		action:function(){
			var view = new compontent.Action({
				collection:new Backbone.Collection(this.model.get('action')),
				view:this
			});
			this.$('.J-view-action').html(view.render().el);
		},
		setting:function(){
			
		},
		pagination:function(){
			var view = new compontent.Pagination({
				model:new Backbone.Model(this.model.get('data').page),
				view:this
			});
			this.$('.J-view-pagination').html(view.render().el);
		},
		content:function(){
			var view = new compontent.Table({
				collection:this.collection,
				view:this
			});
			this.$('.J-view-content-body').html(view.render().el);
			if(view.copyHead){
				setHeight();
				var head = view.copyHead();
				this.$('.J-view-content-header').html(head.el);
			}
		},
		setCollection:function(){
			this.collection.reset();
			this.collection.set(this.model.get('data').body);
		},
		rowCount:function(){
			this.$('.J-row-count').html(this.collection.length);
			this.$('.J-row-selected-count').html(this.collection.where({_selected:true}).length);
		},
		update:function(){
			this.pagination();
			this.setCollection();
			this.content();
			this.rowCount();
		},
		selected:function(){
			this.rowCount();
		}
	});
	
	return Common;
});