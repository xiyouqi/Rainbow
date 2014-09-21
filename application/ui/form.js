define(function(require){
	function len(data) { 
		var l = 0; 
		data = data + '';
		var a = data.split(""); 
		var length = a.length;
		for (var i=0; i < length; i++) { 
			if (a[i].charCodeAt(0)<299) { 
				l++; 
			} else { 
				l+=2; 
			} 
		} 
		return l; 
	}
	
	var verify = function(head,value){
		var message;
		if(head.get('required') && !value && value !== false && value !== 0){
			message = '必须填写';
			return message;
		}
		
		if(value && head.get('max') && len(value) > head.get('max')){
			message = '不能多于'+head.get('max')+'字符';
			return message;
		}

		if(value && head.get('min') && len(value) < head.get('min')){
			message = '不能少于'+head.get('min')+'字符';
			return message;
		}
		
		if(value && head.get('dataType') && head.get('dataType') == 'number' && !$.isNumeric(value)){
			message = '必须为数字';
			return message;
		}
		
		if(value && head.get('dataType') && head.get('dataType') == 'year' && (!$.isNumeric(value) || parseInt(value) < 2012 || parseInt(value) > 2099)){
			message = '年份范围：2012-2099';
			return message;
		}
		
		if(value && head.get('dataType') && head.get('dataType') == 'month' && (!$.isNumeric(value) || parseInt(value) < 201201 || parseInt(value) > 209912)){
			message = '月份格式：201201';
			return message;
		}
	};
	
	//返回字典定义
	var wordbookDefine = function(object){
		var idName = object.viewObject.attr.idName;
		var head = new Backbone.Collection(object.viewObject.attr.head);
		var titleName = head.findWhere({isTitle:true}).get('name');
		return {id:idName,title:titleName};
	};
	
	var control = function(model,value,optionTpl,tpl){
		var form;
		value = value === undefined ? model.get('value') : value === null ? '' : value ;
		value = (typeof value === 'object') ? JSON.stringify(value) : value ;
		
		var select = function(model){
			tpl = tpl ? tpl : '<select name="<%=name%>"></select>';
			var $el = $(_.template(tpl,model.toJSON()));
			var keys = {},emptyDesc;
			optionTpl = optionTpl ? optionTpl : '<option value="<%=id%>"><%=title%></option>';
			
			var levelJoin = function(num){
				var str = '';
				for(var i = 0; i < num; i++){
					str += '│';
				}
				return str;
			};
			
			var setOption = function(list, keys, tree, level){
				var len = list.length;
				var object = {};
				level = level ? level : 0;
				var levelStr = '';
				for(var i = 0 ; i < len; i++){
					object.id = list[i][keys.id];
					object.title = list[i][keys.title] ? list[i][keys.title] : list[i][keys.id];
					object.name = model.get('name');
					levelStr = level ? levelJoin(level) : levelStr;
					if(tree){
						object.title = levelStr + '├' + object.title;
						$el.append(_.template(optionTpl,object));
						list[i]._childList && setOption(list[i]._childList, keys, tree, level + 1);
					}else{
						object.title = levelStr + object.title;
						$el.append(_.template(optionTpl,object));
					}
					
				}
			};
			
			if(!model.get('required') || model.get('isNull')){ //支持空选项
				emptyDesc = model.get('formParam').emptyDesc ? model.get('formParam').emptyDesc : '(空)';
				var object = {id:'',title:emptyDesc,name:model.get('name')};
				$el.append(_.template(optionTpl,object));
			}
			
			if(model.get('metaType') === 'wordbook'){ //字典类型处理
				keys = wordbookDefine(model.get('typeObject'));
				setOption(model.get('typeObject').viewObject.data.body,keys,model.get('typeObject').viewObject.mode === 'tree');
			}else if(model.get('metaType') === 'enum' && model.get('typeObject').list){ //枚举类型处理
				keys = {id:'value',title:'title'};
				setOption(model.get('typeObject').list,keys);
			}else if(model.get('formParam') && model.get('formParam').list){ //表单参数处理
				keys = {id:'value',title:'title'};
				setOption(model.get('formParam').list,keys);
			}
			
			$el.find('option[value='+value+']').attr('selected', true);
			$el.find('input[value='+value+']').attr('checked', true);
			$el.css('width','auto');
			
			if(model.get('form') === 'chosen'){
				$el.addClass('chosen-select');
			}
			
			return $el;
		};
		
		var text = function(model){
			var $el;
			var type = model.get('form') === 'input' ? 'text' : model.get('form');
			if(model.get('form') == 'textarea'){
				$el = $('<textarea rows="4" cols="40" name="'+ model.get('name') +'"></textarea>');
			}else{
				$el = $('<input name="'+ model.get('name') + '" type="' + type + '" />');
			}
			type !== 'file' && $el.val(value);
			return $el;
		};
		
		var checkbox = function(model){
			var $el = text(model);
			if(model.get('metaType') === 'bool'){
				$el.val(1);
				if(value){
					$el.attr("checked", true);
				}
			}
			return $el;
		};
		
		var radio = function(model){
			tpl = '<span></span>';
			optionTpl = '<label class="radio inline">'
  		+ '<input type="radio" name="<%=name%>" value="<%=id%>"><%=title%></label>';
  		return select(model);
		};
		
		var tree = function(model){
			
		};
		
		switch(model.get('form')) {
			case 'select' : form = select(model);break;
			case 'chosen' : form = select(model);break;
			case 'checkbox' : form = checkbox(model);break;
			case 'radio' : form = radio(model);break;
			default : form = text(model) ;
		};
		
		return form;
	};
	
	var form = {
		verify:verify,
		control:control,
		getVal:function(el){
			var $el = $(el);
			
			if($el.find(':radio,:checkbox').size() > 0){
				return $el.find(':checked').val();
			}
			
			if($el.filter(':checkbox').size() > 0){
				return $el.filter(':checked').val();
			}
			
			return $el.val();
		},
		wordbookList:wordbookDefine
	};
	return form;
});