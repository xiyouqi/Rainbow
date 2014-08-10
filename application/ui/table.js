define(function(require){
	var table;
	var isCopy = false;
	var isInput = false;
	var clickIn = false;
	var clickNum = 0;
	var isKeyEvent = false;
	var isInputContent = true;
	
	//是否内容按键
	var isPrintableChar = function (keyCode) {
		return ((keyCode == 32) || //space
			(keyCode == 46) || //delete
			(keyCode == 8) || //backspace
			(keyCode >= 48 && keyCode <= 57) || //0-9
			(keyCode >= 96 && keyCode <= 111) || //numpad
			(keyCode >= 186 && keyCode <= 192) || //;=,-./`
			(keyCode >= 219 && keyCode <= 222) || //[]{}\|"'
			keyCode >= 226 || //special chars (229 for Asian chars)
			(keyCode >= 65 && keyCode <= 90)); //a-z
	};
	
	//文档按键事件创建
	var onKeyDown = function(){
		if(!isKeyEvent){
			$(document).bind('keydown',onKeyDownEvent);
			isKeyEvent = true;
		}
	};
	
	//文档按键事件取消
	var unKeyDown = function(){
		if(isKeyEvent){
			$(document).unbind('keydown',onKeyDownEvent);
			isKeyEvent = false;
		}
	};
	
	//单击事件处理
	var onClickEvent = function(e){
		SHEET.removeSelectList();
		SHEET.$currentCell = $(e.target);
		SHEET.selectedCell();
		onKeyDown();
		clickIn = true;
	};
	
	//双击事件处理
	var onDblClickEvent = function(e){
		SHEET.removeSelectList();
		clickIn = true;
		if(SHEET.$selectBox.hasClass('select')){
			SHEET.showSelectList(e.target);
		}else{
			SHEET.showInput();
			SHEET.$input.select();
		}
	};
	
	//按键事件处理
	var onKeyDownEvent = function(e){
		SHEET.removeSelectList();
		var ctrlDown = (e.ctrlKey || e.metaKey) && !e.altKey;
		if(ctrlDown && !isInput){
			//粘贴处理
			if(e.keyCode == 86){
				SHEET.$input.val('');
				isCopy = true;
				setTimeout(function(){
					SHEET.setCells(SHEET.csvToArray(SHEET.$input.val()));
					SHEET.setCellPosition();
				},300);
			}
		}else{				
			if(e.keyCode === 9 || e.keyCode === 39){
				
				if(SHEET.$currentCell.next('td').size() > 0){
					SHEET.$input.blur();
					SHEET.$currentCell = SHEET.$currentCell.next('td');
					SHEET.selectedCell();
				}
				e.preventDefault();
			}
			
			if(e.keyCode === 37){
				
				if(SHEET.$currentCell.prev('td').size() > 0){
					SHEET.$input.blur();
					SHEET.$currentCell = SHEET.$currentCell.prev('td');
					SHEET.selectedCell();
				}
				e.preventDefault();
			}
			
			if(e.keyCode === 38){
				
				if(SHEET.$currentCell.parent().prev('tr').size() > 0){
					SHEET.$input.blur();
					var index = SHEET.$currentCell.parent().find('td').index(SHEET.$currentCell);
					SHEET.$currentCell = SHEET.$currentCell.parent().prev('tr').find('td').eq(index);
					SHEET.selectedCell();
				}
				e.preventDefault();
			}
			
			
			if(e.keyCode === 40){
				
				if(SHEET.$currentCell.parent().next('tr').size() > 0){
					SHEET.$input.blur();
					var index = SHEET.$currentCell.parent().find('td').index(SHEET.$currentCell);
					SHEET.$currentCell = SHEET.$currentCell.parent().next('tr').find('td').eq(index);
					SHEET.selectedCell();
				}

				e.preventDefault();
			}
			
			
			if(isPrintableChar(e.keyCode) && isInputContent){
				if(!isInput){
					SHEET.$input.val('');
					SHEET.showInput();
				}
				
			}
		}
	};
	
	//输入框失焦事件处理
	var inputBlurEvent = function(e){
		SHEET.$inputBox.height(1).width(1).css('overflow','hidden').hide();
		SHEET.$input.height(0).width(0);
		if(isCopy){
			isCopy = false;
			return;
		}
		
		if(isInputContent){
			SHEET.setCell(SHEET.$currentCell,SHEET.$input.val());
		}
		
		SHEET.setCellPosition();
		isInput = false;
		onKeyDown();
	};
	
	//选定失焦事件处理
	var selectBlurEvent = function(e){
		if($(e.target).is('.dataSheet textarea')){
			return;
		}
		
		if(!clickIn){
			SHEET.cancelSelected();
		}
		clickIn = false;
	};
	
	return table;
});