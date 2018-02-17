
  var socket = io('http://localhost:6600');
  var cache = {}
  var colors = {
		"neo":"green",
		"btc":"orange",
		"eth":"purple",
		"wav":"blue"
  }

  function truncate(data){

		if(data.constructor == Object){
			return "object";
		} else if(data.constructor == Array){
			return "["+data.length+"]";
		} else if(data.length > 16){
			return data.slice(0, 16) + "...";
		}
		return data;
  }

  function setColor(block){

	
	$("span#block-title-"+block).css("background-color",colors[block]);
	$("span#block-title-"+block).css("color","white");
	$("span#block-title-"+block).fadeIn(300);

	setTimeout(function(){

		$("span#block-title-"+block).css("color","black");
		$("span#block-title-"+block).css("background-color","white");
		$("span#block-title-"+block).fadeIn(2000);

	}, 3000);

  }

  function formatBlock(data, newBlock){

		var keys = Object.keys(data.data);

			
		if(newBlock == true){
			var html =  keys.reduce(function(all, k){
				
  				if(k == "baseTarget") return all;
  				if(k == "fee") return all;

				var d = data.data[k];
				var s = '<div class="metric" id="'+data.id+'-'+k+'">'+k+': '+truncate(d)+'</div>';
				
				all = all+s;

				return all;
			}, "");

			var update = '<td class="blockrow"><b><span id="block-title-'+data.id+'">'+data.id+'<span></b><div class="blockchain" id="block-'+data.id+'">'+html+'</div><td>';

    		$("tr#blockchains").append(update);


		} else {

			var html =  keys.reduce(function(all, k){
				
				var d = truncate(data.data[k]);

				var key = data.id+"-"+k;	

				$("div#"+key).html(k+': '+d);

				return all;

			}, "");

		}

		setColor(data.id);

  }
  
  function parseBlock(data){
		
		var newBlock = false;

		if(cache[data.id]){
			cache[data.id][data.data.blockNumber] = data 
		} else {
			cache[data.id] = {}
			cache[data.id][data.data.blockNumber] = data 
			newBlock = true;		
			$("tr#work").append('<td><input class="text" style="width: 200px;" id="'+data.id+'" value="'+data.data.blockHash+'"></td>');
		}

		return {
			raw: data,
			newBlock: newBlock,
			html: formatBlock(data, newBlock)	
		} 

  }

  function main() {
	  $("span#status").text("CONNECTED");
  }
  socket.on('connect', function(){
    console.log("connected"); 
	main();
  });

  socket.on('block', function(data){
    
    parseBlock(data);
    console.log(data); 
  });

  socket.on('disconnect', function(){
    console.log("lost connection to base"); 
  });
