var stepSlider = parseFloat(100 / (p-1));
var stepBar = parseFloat(100 / p);
var pos = parseFloat(bestPlan-1);
var startpos = parseFloat(stepSlider*pos);
var prog = parseFloat(stepBar*(pos + 1));

function message() {
	if ( managedArray[pos] == 1 ){
		m_message = ovz_fully_managed; 
	//	$("#managed").css("color" , "#059301");
		$("#managed").addClass( "managed_highlight" );}
	else {
		m_message = ovz_self_managed;
	//	$("#managed").css("color" , "#313131");
		$("#managed").removeClass( "managed_highlight" );}
};

function progressBar() {
				if (pos == p -1)
					prog=100;
				else
					prog=parseFloat(stepBar*(pos + 1));
			};
			
function scaleBar() {
	for (var s=1; s<=p; s++)
	{
		var stepScale	= parseFloat(stepSlider*(s - 1));
		if(promotedArray[s-1] == 'yes')
			$("#scale").append('<div class="scaleBarLine' + s + ' promoted">|</div>');
		else
			$("#scale").append('<div class="scaleBarLine' + s + ' ">|</div>');
		//$("#scale").append('<div class="scaleBarNum' + s + ' "> '+s+'</div>');
		$(".scaleBarLine" + s).css("left", stepScale +"%");
		//$(".scaleBarNum" + s).css("left", stepScale +"%");
	}
};


$(function() {
	progressBar.call();	
	message.call();
	scaleBar.call();

	var prArray = priceArray[pos].split(" ", 2);
	var currency = prArray[0];
	var priceNum = prArray[1].split(".", 2);
	var dollars =priceNum [0]
	var cents = priceNum [1];
	if(promotedArray[pos] == 'yes') {
		var oldPrArray = realPriceArray[pos].split(" ", 2);
		var oldPriceNum = oldPrArray[1].split(".", 2);
		var oldDollars = oldPriceNum [0]
		var oldCents = oldPriceNum [1];
	}
	
	$("#cpu").text(cpuArray[pos]);
	$("#ram").text(ramArray[pos]);
	$("#disk").text(diskArray[pos]);
	$("#traffic").text(trafficArray[pos]);
	$("#price").html(currency + '<span class="priceSup">' + dollars + '<sup>.' + cents + '</sup>' + ovz_period + '</span>') ;
	$("#managed").text(m_message);
	$("#progress").text(trafficArray[pos]);
	$("#plan").text(planArray[pos]);
	$("#plan_details_href").attr("data-plans", planIdsArray[pos]);
	$('#order_link').attr('href', order_url + '&plan=' + planIdsArray[pos]).attr('rel', 'nofollow');
	$(".meter").css("width", prog+"%");
	if(promotedArray[pos] == 'yes')
		$("#old-price").html(currency + '<span class="priceSup">' + oldDollars + '<sup>.' + oldCents + '</sup>' + ovz_period + '</span>');
	 else
		$("#old-price").html('');
	$("#noUiSlider").noUiSlider( 'init', {
		start: startpos,
		handles: 1,
		connect: "lower",
		step: stepSlider,
		change:
		function() {
			var values = $(this).noUiSlider( 'value');
			pos = parseInt( values[1]/parseInt(stepSlider));
			
			progressBar.call();	
			message.call();
			prArray = priceArray[pos].split(" ", 2);
			currency = prArray[0];
			priceNum = prArray[1].split(".", 2);
			dollars = priceNum [0]
	 		cents = priceNum [1];
			if(promotedArray[pos] == 'yes') {
				oldPrArray = realPriceArray[pos].split(" ", 2);
				oldPriceNum = oldPrArray[1].split(".", 2);
				oldDollars = oldPriceNum [0]
				oldCents = oldPriceNum [1];
			}
			$("#cpu").text(cpuArray[pos]);
			$("#ram").text(ramArray[pos]);
			$("#disk").text(diskArray[pos]);
			$("#traffic").text(trafficArray[pos]);
			$("#price").html(currency +" "+ '<span class="priceSup">' + dollars + '<sup>.' + cents + '</sup>' + ovz_period + '</span>');
			$("#managed").text(m_message);
			$("#progress").text(trafficArray[pos]);
			$("#plan").text(planArray[pos]);
			$("#plan_details_href").attr("data-plans", planIdsArray[pos]);
			$('#order_link').attr('href', order_url + '&plan=' + planIdsArray[pos]).attr('rel', 'nofollow');
			$(".meter").css("width", prog+"%");
			if(promotedArray[pos] == 'yes')
				$("#old-price").html(currency + '<span class="priceSup">' + oldDollars + '<sup>.' + oldCents + '</sup>' + ovz_period + '</span>');
			else
				$("#old-price").html('');
		}
	});
});
