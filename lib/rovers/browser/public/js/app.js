
String.prototype.distance=function(c){var a;a=this;var h,b,d,k,e,g,f,l,n,m,p;a.length>c.length&&(c=[c,a],a=c[0],c=c[1]);k=~~Math.max(0,c.length/2-1);e=[];g=[];b=n=0;for(p=a.length;n<p;b=++n)for(h=a[b],l=Math.max(0,b-k),f=Math.min(b+k+1,c.length),d=m=l;l<=f?m<f:m>f;d=l<=f?++m:--m)if(null==g[d]&&h===c[d]){e[b]=h;g[d]=c[d];break}e=e.join("");g=g.join("");if(d=e.length){b=f=k=0;for(l=e.length;f<l;b=++f)h=e[b],h!==g[b]&&k++;b=g=e=0;for(f=a.length;g<f;b=++g)if(h=a[b],h===c[b])e++;else break;a=(d/a.length+
d/c.length+(d-~~(k/2))/d)/3;a+=0.1*Math.min(e,4)*(1-a)}else a=0;return a};

  var socket = io('http://localhost:6600');
  var cache = {}
  var colors = {
		"neo":"green",
		"btc":"orange",
		"eth":"purple",
		"wav":"blue"
  }


  function animate(id, s, m, span){

      var p = $("input#publicKey").val();

	  if(s.length > 0){
 
			var t = s.pop();
  			var dist = p.distance(m);
			span = span + t.charCodeAt(0);
			m = m + t; 

			$("span#num-"+id).html(span + " - " + dist);

			$("input#"+id).val(m);

			setTimeout(function() {

				animate(id, s, m, span);

			}, 50);

	  }  else {
		 return;
	  }

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

			var shaObj = new jsSHA("SHA-256", "TEXT");
				shaObj.update(data.data.blockHash);
			data.data.blockHash = shaObj.getHash("HEX");

			animate(data.id, data.data.blockHash.split(""), "", 0);

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
			$("tr#work").append('<td><span id="num-'+data.id+'"></span></br><input class="text" style="float: left; width: 260px;" id="'+data.id+'" value="'+data.data.blockHash+'"></td>');

			var shaObj = new jsSHA("SHA-256", "TEXT");
				shaObj.update(data.data.blockHash);
			data.data.blockHash = shaObj.getHash("HEX");

			animate(data.id, data.data.blockHash.split(""), "", 0);   
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

  socket.on('setup', function(data){
	$("span#publicKey").html(" - "+data.address);
	$("input#publicKey").val(data.publicKey);
  });

  socket.on('disconnect', function(){
    console.log("lost connection to base"); 
  });



