define(function(require){
	
	var Node = Backbone.View.extend({
		tagName:'li',
		events:{
			'click em:not(.node)':'toggle',
			'click div':'onClick'
		},
		initialize:function(){
			this.tree = this.options.tree;
			this.tree.selectedColl.on('add',this.changeSelected,this);
			this.parent = this.options.parent;
			this.childs = [];
		},
		render:function(){
			var html = '<div><em class="fn-iblock"></em><i class="fn-iblock"></i><span class="fn-iblock"><%=name%></span></div>';
			this.$el.html(_.template(html,{name:this.model.get(this.tree.titleName)}));
			if(this.model.get('_childList')){
				this.renderChild(this.model.get('_childList'));
			}else if(this.tree.isNode 
				&& (this.tree.isNode.result == (this.model.get(this.tree.isNode.name) == this.tree.isNode.value))){
				this.$('em').addClass('node');
				this.$('i').addClass('node');
			}else if(this.tree.model.get('mode') === 'tree'){
				this.$('em').addClass('node');
				this.$('i').addClass('node');
			}

			if(this.tree.defaults && _.indexOf(this.tree.defaults,this.model.get(this.tree.idName)) !== -1){
				this.selected(true);
			}
			return this;
		},
		renderChild:function(list){
			if(this.$('i').hasClass('loading')){
				this.$('i').removeClass('loading');
			}
			(this.tree.open || this.model.get('_isRoot')) && this.$el.addClass('open');
			var $ul = $('<ul></ul>');
			this.$el.append($ul);
			var coll = new Backbone.Collection(list);
			for(var i = 0; i < coll.length; i++){
				if(this.tree.noDisplay 
					&&  _.indexOf(this.tree.noDisplay,coll.at(i).get(this.tree.idName)) !== -1){
					continue;
				}
				this.tree.nodes[coll.at(i).get(this.tree.idName)] = new Node({model:coll.at(i),tree:this.tree,parent:this});
				this.childs.push(this.tree.nodes[coll.at(i).get(this.tree.idName)]);
				$ul.append(this.tree.nodes[coll.at(i).get(this.tree.idName)].render().el);
			}
			return this;
		},
		toggle:function(e){
			if(this.tree.model.get('mode') === 'list' && this.$('ul').size() < 1){
				this.$('em').addClass('loading');
				this.$el.addClass('open');
				this.tree.model.filterModel.set({_node:this.model.get(this.tree.idName)});
			}else if(this.$el.hasClass('open')){
				this.$el.removeClass('open');
			}else{
				this.$el.addClass('open');
			}
			return false;
		},
		onClick:function(e){
			if(this.tree.selectedColl.get(this.model.cid)){
				this.deselect();
			}else{
				this.selected();
			}
			return false;
		},
		changeSelected:function(model){
			if(!model || model != this.model){
				this.deselect();
			}
			return this;
		},
		selected:function(self){
			if(!this.tree.selectedColl.get(this.model.cid)){
				this.tree.selected(this.model);
				this.$el.addClass('on');
				!this.self && this.tree.multiple && this.tree.gear && this.parent && this.parent.selected();
			}
			return this;
		},
		deselect:function(){
			this.tree.deselect(this.model);
			this.$el.removeClass('on');
			if(this.tree.multiple && this.tree.gear && this.childs.length > 0){
				_.each(this.childs,function(node){
					node.deselect();
				},this);
			}
			return this;
		}
	});
	
	var tree = {
		Base:Backbone.View.extend({
			tagName:'ul',
			className:'tree',
			initialize:function(){
				this.mode = this.options.mode ? this.options.mode : 'snyc';
				this.isNode = this.options.isNode;
				this.select = this.options.select;
				this.url = this.options.url;
				this.hasRoot = this.options.hasRoot;
				this.collection = new Backbone.Collection;
				this.selectedColl = new Backbone.Collection;
				this.defaults = this.options.defaults;
				//默认打开所有节点
				this.open = this.options.open;
				//不允许显示的节点列表（包括子节点）
				this.noDisplay = this.options.noDisplay;
				//不允许选择的节点
				this.noSelected = this.options.noSelected;
				//默认选定
				this.defaultSelected = this.options.defaultSelected;
				//多选支持
				this.multiple = this.options.multiple;
				//联动
				this.gear = this.options.gear;
				//this.titleName = head.findWhere({isTitle:true}).get('name');
				this.nodes = {};
				if(!this.model){
					//var Model = require('../view/model');
					var Model = COMS.viewModel;
					this.model = new Model;
					this.options.filter 
					&& this.model.filterModel.set(this.options.filter,{silent: true});
					this.model.setCallBack($.proxy(this.callBack,this));
					this.model.url = this.options.url;
					this.model.request();
				}else{
					this.collection.add(this.model.get('data').body);
					var head = new Backbone.Collection(this.model.get('attr').head);
					this.titleName = head.findWhere({isTitle:true}).get('name');
				}
			},
			callBack:function(){
				if(this.collection.size()){
					this.nodes[this.model.get('data').node.id].renderChild(this.model.get('data').body);
				}else{
					this.idName = this.model.get('attr').idName;
					this.nodeName = this.model.get('param').nodeName;
					var head = new Backbone.Collection(this.model.get('attr').head);
					this.titleName = head.findWhere({isTitle:true}).get('name');
					if(this.hasRoot){
						var object = {
							_childList:this.model.get('data').body,
							_isRoot:true
						};
						object[this.idName] = this.model.get('data').node.id;
						object[this.titleName] = this.model.get('data').node.name;
						this.collection.add(object);
						this.renderNode(new Backbone.Model(object));
					}else{
						this.collection.add(this.model.get('data').body);
						this.render();
					}
				}
			},
			render:function(){
				//模型不存在请求模型
				if(!this.model.toJSON()){
					this.model.request();
					return;
				}
				this.collection.each(this.renderNode,this);
				return this;
			},
			renderNode:function(model){
				if(this.noDisplay 
					&&  _.indexOf(this.noDisplay,model.get(this.idName)) !== -1){
					return;
				}
				
				this.nodes[model.get(this.idName)] = new Node({
					model:model,
					tree:this
				});
				this.$el.append(this.nodes[model.get(this.idName)].render().el);
			},
			destroy:function(){
				this.remove();
			},
			selected:function(model){
				var option = this.multiple ? {silent:true} : {silent:false};
				this.selectedColl.add(model,option);
				this.trigger('selected');
			},
			deselect:function(model){
				this.selectedColl.remove(model);
				this.trigger('selected');
			}
		})
	};
	
	//简单模式
	tree.Simple = tree.Base.extend({
		
	});
	
	//多选模式
	
	return tree;
});