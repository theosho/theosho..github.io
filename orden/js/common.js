function create_dialog(jqObj, options) {
	jqObj.dialog({
		autoOpen: false,
		modal: true,
		width: 'auto',
		hide: 'blind',
		position: 'center',
		resizable: false,
		overlay: {
			backgroundColor: '#000',
			opacity: 0.5
		}
	});

	if (options)
		jqObj.dialog('option', options);    
}

function str_repeat(string, count) {
	var i;
	var result = '';
	for (i = 0; i < count; i++) {
		result = result + string;
	}
	return result;
}

function sprintf(format, arg) {
	var result = '';
	var regexp = new RegExp('(.*)%(.*)\.(\.)f(.*)', 'i');
	var res = regexp.exec(format);
	if (res) {
		result = res[1];
		var precision = res[3];
		var number = ((precision > -1) ? Math.round(parseFloat(arg) * Math.pow(10, precision)) / Math.pow(10, precision): parseFloat(arg)).toString();
		if (number.indexOf('.') == -1) {
			result = result + number + '.' + str_repeat('0', precision);
			} else if (number.length - number.indexOf('.') - 1 < precision) {
			result = result + number + str_repeat('0', precision - (number.length - number.indexOf('.') - 1));
			} else {
			result = result + number;
		}
		result = result + res[4];

		return result;
		} else {
		return false;
	}
}

function showMsg(type, msg, params) {
	
	if (params)
		for (k in params)
			msg = msg.replace('%' + k + '%', params[k]);
	
	if (type == 'error') {
		return $.achtung({message: msg, className: 'achtungFail', timeout: 0});
	} else if (type == 'success') {
		//$('.achtungFail').achtung('close');
		return $.achtung({message: msg, className: 'achtungSuccess', timeout: 5});
    } else if (type == 'notice') {
		return $.achtung({message: msg, className: 'achtungWait', timeout: 5});
	} else {
		alert('Unknown error');
	}
}

var indicator;
var indicator_count = 0;
function spi() {
	if (typeof please_wait_lang == 'undefined')
		var please_wait_msg = 'Please wait ...';

	if (jQuery().achtung) {
		indicator_count++;
		if (indicator_count == 1)
			indicator = $.achtung({icon: 'wait-icon', disableClose: true, message: please_wait_lang, timeout: 0});
	}
}

function hpi() {
	if (jQuery().achtung) {
		indicator_count--;
		if (indicator_count == 0)
			indicator.achtung('close');
	}
}

function loadSafe(container, url, params, callback) {
	var submit_type = 'GET';
	if (typeof params === "string") {
		submit_type = 'POST';
	} else if (typeof params === "function") {
		callback = params;
		params = '';
	} else {
		params = '';
	}
	spi();
	$.ajax({
		'url': url,
		'type': submit_type,
		'data': params,
		'dataType': 'html',
		success: function(data){
			hpi();
			if (data.substr(0, 15) === '{"status":false') {
				try {
					var obj = eval('(' + data + ')');
					showMsg('error', obj.msg);
				} catch (err) { alert('Unknown error') }
			} else {
				if (typeof container === "object")
					container.html(data);
				if (typeof callback === "function")
					callback();
			}
		}
	});
}

function get_tax(period_val) {
	if (typeof period_val == 'undefined')
		return;

	$('#comp_details').html('');
	$('#comp_phone').html('');
	c_val = $('#client_country').val();
	if ($('#client_country').val() == 'US')
		s_val = $('#client_state_us').val();
	else
		s_val = $('#client_state').val();
	get_is_business_value = $('[name=is_business]:checked').val();

	if (typeof get_is_business_value == 'undefined' || get_is_business_value == 'undefined')
		var b_val = 0;
	else
		var b_val = get_is_business_value;

	var p_val = "&purchase[0][type]=plan&purchase[0][period]=" + period_val;
	var dp_array = [];
	if ($('table#selected_domains_table tr.domain_tr').length > 0) {
		$('table#selected_domains_table tr.domain_tr .domain_period').each(function(){
			var pperiod = $(this).val();
			pperiod = pperiod.replace('period_', '');
			dp_array.push(pperiod);
		});
		var longest_domain_period = Math.max.apply( null, dp_array ) / 12;
		p_val += "&purchase[1][type]=domain&purchase[1][period]="+longest_domain_period;
	}

		$.get('ajax.php?action=get_tax&country=' + c_val + '&state=' + s_val + '&is_business=' + b_val + p_val, function(data){
			var array = $.parseJSON(data);
			if (array.skip_pm)
				return;
			//alert (data);
			$.each(array, function(key, value) {
				$.each(value, function (k, v) {
					if (v == 'FirstData') {
						$('.cc_payments').attr('id', v);
					} else if (v == 'PayPalDP') {
						$('.cc_payments').attr('id', v);
					}
				});
			});
			var get_payment_method_value = $('#payment-block span.selected a[id^="payment_"]:visible').attr('pm');
			//var get_tax_group_value = $('#payment-block span.selected a[id^="payment_"]:visible').attr('tax_group');
			$('#payment_method').val(get_payment_method_value);
			//$('#tax_group').val(get_tax_group_value);
		})

	var selected_pm = $('.remp span.selected a').attr('data-pm-type');
	var comp_details = $('#company_details_'+selected_pm).html();
	var ph_details = $('#company_phones_'+selected_pm).html();
	$('#comp_details').html(comp_details);
	$('#comp_phones').html(ph_details);
}

function get_payment_methods_new(period_val) {
	c_val = $('#client_country').val();
	if ($('#client_country').val() == 'US')
		s_val = $('#client_state_us').val();
	else
		s_val = $('#client_state').val();
	get_is_business_value = $('[name=is_business]:checked').val();

	if (typeof get_is_business_value == 'undefined' || get_is_business_value == 'undefined')
		var b_val = 0;
	else
		var b_val = get_is_business_value;

	var p_val = "&purchase[0][type]=plan&purchase[0][period]=" + period_val;
	if ($('table#selected_domains_table tr.domain_tr').length > 0) {
		var dp_array = [];
		$('.domain_period').each(function(){
			var pperiod = $(this).val();
			pperiod = pperiod.replace('period_', '');
			dp_array.push(pperiod);
		});
		var longest_domain_period = Math.max.apply( null, dp_array ) / 12;
		p_val += "&purchase[1][type]=domain&purchase[1][period]="+longest_domain_period;
	}

	$.get('ajax.php?action=get_tax&print_pm=1&country=' + c_val + '&state=' + s_val + '&is_business=' + b_val + p_val, function(data){
		$('#payment-block > .ui-widget-header.tabs-new').remove();
		$('#payment-block #all_pm').remove();
		$('#payment_method').remove();
		$('#payment-block').prepend(data);
	}).done(function(){
		set_the_tax();
		toggle_business($('input[name="is_business"]:checked').val());
		updateTotalPrices();
	});
}