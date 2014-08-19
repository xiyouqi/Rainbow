define(function(require){
	var filter = {};
	
	filter.time = function(value, raw, isDate){
		var str = '';
		time = parseInt(value);
		if(time){
			var date = new Date(time);
			var today = new Date();
			var y = date.getFullYear();
			var m = date.getMonth() + 1;
			m = m < 10 ? '0' + m : m;
			var d = date.getDate();
			d = d < 10 ? '0' + d : d;
			if(date.getFullYear() != today.getFullYear() || raw){
				str += y + '-';
				str += m + '-';
				str += d + '';
				if(!isDate){
					str += ' ' + (date.getHours()<10?'0'+date.getHours():date.getHours());
					str += ':' + (date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes());
				}
			}else{
				if(date.getMonth() != today.getMonth()){
					str += m + '-';
					str += d ;
					if(!isDate){
						str += ' ' + (date.getHours()<10?'0'+date.getHours():date.getHours());
						str += ':' + (date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes());
					}
				}else if(date.getDate() != today.getDate()){
					str += d + '日';
					str += ' ' + (date.getHours()<10?'0'+date.getHours():date.getHours());
					str += ':' +(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes());
				}else{
					str += ' ' + (date.getHours()<10?'0'+date.getHours():date.getHours());
					str += ':' + (date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes());;
				}
			}
			
		}else{
			str = value;	
		}
		return str;
	};
	
	filter.date = function(value){
		return filter.time(value, true, true);
	};
	
	filter.file = function(value){
		return value ? '<a href="' + GBROS.path + 'sysfile?_node=' + value + '" target="_blank">打开</a>' : '';
	};
	
	filter.json = function(value){
		return value;
	};
	
	filter.string = function(value){
		return value;
	};
	
	filter.text = function(value){
		return value;
	};
	
	filter.byte = function(value,format){
		var str = '-';
		var size = parseInt(value);
		if(size){
			if(size && size < 1024){
				str = '1KB';
			}else if(size < 1048576){
				str = Math.round(size/1024) + 'KB';
			}else{
				str = (size/1048576).toFixed(2) + 'MB';
			}
		}else{
			str = value;
		}
		
		return str;
	};
	
	filter.money = function(value,format){
		return value;
	};
	
	/*
	filter.bool = function(value,format){
			return value ? '鏄� : '鍚�;
		};*/
	
	
	return filter;
});