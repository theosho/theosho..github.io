$.fn.outerHtml = function(){
	return $('<div></div>').append( $(this[0]).clone() || '' ).html();
};
function get_hash() {
	var pos = location.hash.indexOf('#');
	if (pos == -1)
		return [];

	var params = location.hash.substring(pos + 1);
	params = params.split('/');
	return params;
}

var validate_count = 0;
var do_proceed = undefined;
function validate_input(jobj) {
	validate_count++;

	if (jobj.attr('empty') == 1 && jobj.val() == '') {
		jobj.attr('validated', 1).css('border', '1px solid green');
		validate_count--;
		return;
	}

	var as = jobj.attr('as');
	$.get('ajax.php?action=validate&value=' + encodeURIComponent(jobj.val()) + '&as=' + as, function(data){
		if (!data['status']) {
			jobj.attr('validated', 0).css('border', '1px solid red');
			if (data['msg'] && !$('#invalid_msg_' + as)[0]) {
				$.each($('#invalid_msg_' + as), function() {
					$(this).closest('div.achtungFail').achtung('close');
				});
				showMsg('error', '<span id="invalid_msg_' + as + '"></span>' + data['msg']);
			}
		} else {
			
			if ($('#invalid_msg_' + as).closest('div.achtungFail').length)
				$('#invalid_msg_' + as).closest('div.achtungFail').achtung('close');
			else if ((jobj.attr('id') != undefined) && $('#invalid_msg_' + jobj.attr('id')).closest('div.achtungFail').length)
			 	$('#invalid_msg_' + jobj.attr('id')).closest('div.achtungFail').achtung('close');

			jobj.attr('validated', 1).css('border', '1px solid green');
		}
		
		validate_count--;
		
		if (validate_count == 0  && typeof do_proceed == 'function' && data['status']) {
			do_proceed();
			do_proceed = undefined;
		}

	}, 'json');
}

function validate_all(container) {
	$('input.validate:visible,select.validate:visible', container).each(function(){
		if (typeof $(this).attr('empty') == 'undefined') {
			if ($(this).val() == '') {
				$(this).attr('validated', 0).css('border', '1px solid red');
				var msg_id = typeof $(this).attr('id') != 'undefined' ? $(this).attr('id') : $(this).attr('as');
				
				$.each($('#invalid_msg_' + msg_id), function() {
					$(this).closest('div.achtungFail').achtung('close');
				});
				
				if (typeof invalid_details['invalid_' + msg_id] == 'undefined')
					console.error('invalid_' + msg_id + ' is not defined');
				else 
					showMsg('error', '<span id="invalid_msg_' + msg_id + '"></span>' + invalid_details['invalid_' + msg_id]);
			}
		} else {
			if ($(this).val() == '') {
				$(this).attr('validated', 1).css('border', '1px solid green');
				
				if ($('#invalid_msg_' + $(this).attr('id')).closest('div.achtungFail').length)
					$('#invalid_msg_' + $(this).attr('id')).closest('div.achtungFail').achtung('close');
				else if ($('#invalid_msg_' + $(this).attr('as')).closest('div.achtungFail').length)
			 		$('#invalid_msg_' + $(this).attr('as')).closest('div.achtungFail').achtung('close');
			}
		}
	});

	var errors = $('input.validate:visible,select.validate:visible', container).filter("[validated='0']");
	if (errors.length > 0) {
		errors.eq('0').focus();
		return false;
	}

	return true;		
}

function updateTotalPrices() {
	var curr = getCurrency();
	var amount = parseFloat(curr.attr('price'));
	
	var debug = false;
	
	var upgrades = domains = ssl = tldssl = storage = 0
	$('span.upgrade_price:visible', panel).each(function() { 
		if (!isNaN(parseFloat($(this).attr('price')))) {
			amount = amount + parseFloat($(this).attr('price'));
			upgrades = upgrades + parseFloat($(this).attr('price'));
		}
	});

	$('span.tld-price,div.tld-price-id-protect', $('#selected_domains')).each(function(){
		if (!isNaN(parseFloat($(this).attr('price')))) {
			amount = amount + parseFloat($(this).attr('price'));
			domains = upgrades + parseFloat($(this).attr('price'));
		}
	});

	$('.additional_ssl .ssl_price', $('#products-block, #Host_Domain:visible')).each(function(){
		if (!isNaN(parseFloat($(this).data('price')))) {
			amount = amount + parseFloat($(this).data('price'));
			ssl = ssl + parseFloat($(this).attr('price'));
		}
	});

	$('.tld-price-ssl-certificate', $('#selected_domains')).each(function(){
		if (!isNaN(parseFloat($(this).data('price')))) {
			amount = amount + parseFloat($(this).data('price'));
			tldssl = tldssl + parseFloat($(this).data('price'));
		}
	});

	$('[name^=storage_configuration]:visible', panel).each(function() {
		if (($(this).val() == ''))
			return;

		var currency = curr.val();
		var elem = $(this).find('[value="' + $(this).val() + '"]');
		var disk_price = elem.data('price-' + currency.toLowerCase());
		var default_disk_price = $(this).find('option[data-price="0"]').data('default-price-' + currency.toLowerCase());

		var period = getPeriod().val();

		switch($(this).data('disk-type')) {
			case "default":
				if ((typeof disk_price == 'undefined') || (typeof default_disk_price == 'undefined') || (disk_price == 0))
					return;
				
				var disk_amount = parseFloat(disk_price - default_disk_price);
				if (isNaN(disk_amount))
					return;
			break;
			case "additional":
				if ((typeof disk_price == 'undefined'))
					return;
				
				if (isNaN(disk_price))
					return;
			break;
			default:
				return;				
		}
		
		amount = amount + (disk_price * period);	
		storage = storage + (disk_price * period);	
	});
	
	if (debug) {
		console.log('plan: ' + amount);
		console.log('upgrades: ' + upgrades);
		console.log('domains: ' + domains);
		console.log('ssl: ' + ssl);
		console.log('tldssl: ' + tldssl);
		console.log('storage: ' + storage);
	}
	
	var currency = curr.val();
	var country = $('#client_country');
	var option = $('option:selected', country);

//kriss
	var tax_group = $('input#tax_group').val();
	var check_state = option.attr('states');
	var get_state = $('#client_state_us').val();
	var data_tax_attr = $('#payment-block span.selected a').attr('data-tax');
	if (typeof data_tax_attr == 'undefined' || data_tax_attr == '')
		var vat = '';
	else
		var vat = parseFloat(data_tax_attr);
	//alert (vat);
	
	discount = 0;
	if (typeof discount_applied_msg != 'undefined') discount_applied_msg.remove();
	if (typeof discount_is_zero_msg != 'undefined') discount_is_zero_msg.remove();
	if (typeof discount_error_msg != 'undefined') discount_error_msg.remove();

	$('#original_amount').parent().hide();
	$('#amount_total').parent().hide();

	$('#euro_amounts').hide();
	$('#original_amount, #amount_discount').parent().hide();
	//$('#original_amount, #amount_discount').html('');

	if ($('input[name="promo_code"]').val()) {
		$.ajax({
			type: "POST",     
			async: false,
			url: 'ajax.php?action=get_discount&code=' + $('input[name="promo_code"]').val(),
			data: $('#orderForm').serialize(),
			dataType: 'json',
			success: function(data) {
				discount = 0;
				
				if (data.discount) {
					$('#original_amount').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, amount));
					$('#original_amount').parent().show();

					promo_code_discount = data.discount;
					amount = amount - promo_code_discount;
					discount = discount + promo_code_discount;

					if ($('#amount_discount').html() == '')
						showMsg('success', discount_applied);

					$('#amount_discount').html('-' + sprintf(currency_symbols[currency] + '%0.2f ' + currency, discount));
					$('#amount_discount').parent().show();
					$('#euro_amounts').show();
					
				} else { 
					//$('#original_amount, #amount_discount').html('');
				
					if (data.error_msg){
						discount_error_msg = showMsg('error', data.error_msg);
					} else {
						discount_is_zero_msg = showMsg('error', discount_is_zero);
					}
				}
			}
		});
	} else {
		if ($('#original_amount').is(':visible')) {
			$('#original_amount').html('');
			$('#original_amount').parent().hide();
		}

		if ($('#amount_discount').is(':visible')) {
			$('#amount_discount').html('');
			$('#amount_discount').parent().hide();
		}

		if ($('#euro_amounts').is(':visible')) {
			$('#euro_amounts').hide();
		}
	}
	
	// check for promo_domain
	if (get_promo() != 'none') {
		var promo_domain_element = $('#selected_domains_table input[name="promo"]');
		if ($('#selected_' + promo_domain_element.attr('value')).length) {
			promo_domain_discount = $('#selected_' + promo_domain_element.attr('value').replace(/\./, '_') + ' .tld-price').attr('price');
			if (promo_domain_discount) {
				$('#original_amount').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, amount));		
				$('#original_amount').parent().show();
				amount = amount - promo_domain_discount;
				discount = discount + promo_domain_discount;
			}
			
		}
	}

	if (vat !== '') {
		$('#amount_discount').parent().css({'margin-bottom': '5px'});
		var amount_vat = amount * (vat / 100);
	
		total_amount = amount + amount_vat;
		/*
		if (discount) {
			$('#amount_discount').html('-' + sprintf(currency_symbols[currency] + '%0.2f ' + currency, discount));
			$('#amount_discount').parent().show();
		} else {
			$('#amount_discount').parent().hide();
			$('#amount_discount').html('');
		}
		*/

		//alert (vat);
		$('#vat_percent').text((vat) + '%');
		$('#amount').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, amount));
		$('#amount_vat').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, amount_vat));
		$('#amount_total').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, total_amount));
		$('#euro_amounts').show();
		//alert(1);
	} else {
		total_amount = amount;
		/*
		if (discount) {
			$('#amount_discount').html('-' + sprintf(currency_symbols[currency] + '%0.2f ' + currency, discount))
			$('#amount_discount').parent().show();
		} else {
			$('#amount_discount').parent().hide();
			$('#amount_discount').html('');
		}
		*/

		//alert(2);
		$('#amount').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, amount));
		$('#amount_vat').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, amount_vat));
		$('#amount_total').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, total_amount));
	}
	
	$('#amount_total').parent().show();
	
	/*
	if (tax_group == 'uk' && typeof option.attr('uk_business_tax') !== 'undefined'
			&& option.attr('uk_business_tax') !== false
			&& typeof option.attr('uk_not_business_tax') !== 'undefined'
			&& option.attr('uk_not_business_tax') !== false) {
			$('#euro_amounts').css('display', '');
		if ($('input.is_business:checked').val() == 1)
			var vat = parseFloat(option.attr('uk_business_tax'));
		else
			var vat = parseFloat(option.attr('uk_not_business_tax'));
		var amount_vat = amount * (vat / 100);
		$('#vat_percent').text((vat) + '%');
		$('#amount').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, amount));
		$('#amount_vat').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, amount_vat));
		$('#amount_total').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, amount + amount_vat));
	} else if (tax_group == 'us' 
			&& typeof option.attr('us_tax') !== 'undefined' 
			&& option.attr('us_tax') !== false 
			&& get_state.indexOf(check_state) >= 0) {
			$('#euro_amounts').css('display', '');
		var vat = parseFloat(option.attr('us_tax'));
		var amount_vat = amount * (vat / 100);
		$('#vat_percent').text((vat) + '%');
		$('#amount').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, amount));
		$('#amount_vat').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, amount_vat));
		$('#amount_total').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, amount + amount_vat));
	} else {
		$('#amount_total').html(sprintf(currency_symbols[currency] + '%0.2f ' + currency, amount));
		$('#euro_amounts').css('display', 'none');
	}*/
}

function getCurrency() {
	//var container = $('div.prices:visible', panel);
	switch($(panel).attr('id')) {
		case "SSL":
			var ssl_type = $('#SSL select[name="ssl_data[type]"]').val();	
			var container = '#' + ssl_type + '_prices_' + getSelectedPlanOption().attr('value') + '_' + getPeriod().val();
		break;
		default:
			var container = '#price_' + getSelectedPlanOption().attr('value') + '_' + getPeriod().val();
	}
	
	return $('input.currencies:checked', $(container));
}

function getPeriod(container) {
	if (container)
		return $('input.periods:checked', container);

	switch($(panel).attr('id')) {
		case "SSL":
			return $('#SSL select[name="ssl_data[period]"]');
		break;
		default:
			return $('input.periods:checked', panel);
	}
}

function getSelectedPlanOption() {
	switch($(panel).attr('id')) {
		case "Domain_Names":
		case "SSL":
			return $('#' + $(panel).attr('id') + ' input.plans');
		break;
		default:
			return $('select.plans option:selected', panel);
	}
}

function get_promo() {
	var opt = getSelectedPlanOption();
	var period = getPeriod().val();

	if (period > 1 && opt.attr('free') == '1') {
    	$('span.promo_text', $('#selected_domains_table')).text(promo_msg);
    	$('td.promo_td', $('#selected_domains_table')).css('visibility', 'visible');
		return 'free';
	} else if (period > 1 && opt.attr('free') == '0') {
		$('span.promo_text', $('#selected_domains_table')).text(promo_msg);
		$('td.promo_td', $('#selected_domains_table')).css('visibility', 'visible');
		return 'promo';
	} else {
		$('td.promo_td', $('#selected_domains_table')).css('visibility', 'hidden');
		return 'none';
	}		
}

function is_tld_free (tld) {
	var hasMatch = false;
	var opt = getSelectedPlanOption();
	$.each(free_tlds, function(plan_id, tlds) {
		if (plan_id == opt.val()) {
			$.each(tlds, function(k, t) {
				if (t == tld) {
					hasMatch = true;
					return false;
				}
			});
			if (hasMatch)
				return false;
		}
	});

	if (hasMatch)
		return true;

	return false;

}

function set_promo_price(domain, promo) {
	var dom_tr = $('#selected_' + domain.replace(/\./g, '_'));
	var price = $('span.tld-price', dom_tr);
	var period = $('input.domain_period', dom_tr).val();
	var tld = domain.substring(domain.indexOf('.') + 1);

	if (promo == 'free' && is_tld_free(tld)) {
    	for (var first_period in domainProducts[tld]['prices']) break;
    	var d_price = domainProducts[tld]['prices'][period][currency] - domainProducts[tld]['prices'][first_period][currency];
    	price.attr('price', d_price).html(currency_symbols[currency] + sprintf('%0.2f', d_price));
	} else if (promo == 'promo' || (promo == 'free' && !is_tld_free(tld))) {
		if ('undefined' == typeof registerdomainProducts[tld][price_option])
			price_option = 'prices';
    	var d_price = domainProducts[tld]['prices'][period][currency];
    	price.attr('price', d_price).html(currency_symbols[currency] + sprintf('%0.2f', d_price));
	} else {
		var price_option = dom_tr.find('input[name^=transfer]').size() ? 'prices_transfer' : 'prices_register';
		if ('undefined' == typeof registerdomainProducts[tld][price_option])
			price_option = 'prices';

		if ('undefined' == typeof registerdomainProducts[tld][price_option][period])
			return;
		else {
			var d_price = registerdomainProducts[tld][price_option][period][currency];
			price.attr('price', d_price).html(currency_symbols[currency] + sprintf('%0.2f', d_price));
		}
	}
}

var promo_domain = '';
function choose_promo(domain) {
	if ($('tr.domain_tr', $('#selected_domains_table')).length == 0) return;
	if (domain == '') return;
	var pr = get_promo();
	set_promo_price(domain, pr);

	if (promo_domain != '' && promo_domain != domain && $('#selected_' + promo_domain.replace(/\./g, '_'))[0])
		set_promo_price(promo_domain, 'none');

	promo_domain = domain;
	
	updateTotalPrices();
}

function select_owner_details() {
	if ($('#selected_owner_details')[0]) {
		$('#selected_owner_details').html(
			'<div class="split">' +
				($('#client_company_name').val() != '' ? '<div>' + $('#client_company_name').val() + 
				($('#client_vat_number').val() != '' ? ' (' + $('#client_vat_number').val() + ')' : '') + '</div>' : '') +
				'<div>' + $('#client_firstname').val() + ' ' + $('#client_lastname').val() + '</div>' +
				'<div>' + $('#client_email').val() + '</div>' +
				'<div>' + $('#client_phone').val() + '</div>' +
			'</div>' +
			'<div class="split">' +
				'<div>' + $('#client_address1').val() + '</div>' +
				($('#client_address2').val() != '' ? '<div>' + $('#client_address2').val() + '</div>' : '') +
				'<div>' + $('#client_city').val() + ', ' + 
				($('#client_country').val() == 'US' ? $('#client_state_us option:selected').text() : $('#client_state').val()) + ' ' + $('#client_zip').val() + '</div>' +
				'<div>' + $('#client_country option:selected').text() + '</div>' +
			'</div>'
		);
	//$('#add_owner_details').val('edit_owner_details');
	}
}

function vtip() {
	this.xOffset = -40; // x distance from mouse
	this.yOffset = 18; // y distance from mouse
	//this.xOffset = -10; // x distance from mouse
	//this.yOffset = 15; // y distance from mouse

	$("div.tip").unbind()
	.on('mouseenter', function() {
		this.t = this.title;
		this.title = '';
		this.offset = $(this).offset();

		$('body').append('<p id="vtip"><img id="vtipArrow" />' + this.t + '</p>');
		$('p#vtip #vtipArrow').attr("src", 'images/vtip_arrow.png');
		$('p#vtip').css("top", (this.offset.top + yOffset) + "px").css("left", (this.offset.left + xOffset) + "px").fadeIn("slow");
	})
	.on('mouseleave', function() {
		this.title = this.t;
		$("p#vtip").fadeOut("slow").remove();
	});
};

function toggle_host_domain(host_domains) {
	if (host_domains == 0) {
		if ($('#host_domain_option:visible')[0]) $('#register_domains_option a').click();
		$('#host_domain_option:visible').hide();
	} else {
		$('#host_domain_option:hidden').show();	
	}
}

function toggle_business(is_business) {
	var get_period_value = $('#products-block > .ui-widget-content > div:visible input[name^="period\["]:checked').val();
	get_tax(get_period_value);

	if (is_business == 1) {
		$('#vat_number').css('display', '');
	} else {
		$('#vat_number').css('display', 'none');
	}
}

function updateDomainPrices() {
	var tld, period;
	$('tr.domain_tr').each(function(){
		tld = $(this).attr('tld');
		period = $('.domain_period', $(this)).val();
		
		if (!period)
			return;
		var price_option = $(this).find('input[name^=transfer]').size() ? 'prices_transfer' : 'prices_register';
		if ('undefined' == typeof registerdomainProducts[tld][price_option])
			price_option = 'prices';

		if (typeof promo_domain == 'undefined' || $(this).attr('id') != 'selected_' + promo_domain.replace(/\./g, '_')) {
			$('.tld-price', $(this))
				.attr('price', registerdomainProducts[tld][price_option][period][currency])
				.html(sprintf(currency_symbols[currency] + '%0.2f', registerdomainProducts[tld][price_option][period][currency]));
		}

		if (domainsInfo[tld]['id_protect'])
			$('.tld-price-id-protect', $(this))
				.attr('price', idpProduct.prices[period][currency])
				.html(sprintf(currency_symbols[currency] + '%0.2f', idpProduct.prices[period][currency]));
		
		var ssl_period = $('.ssl_period', $(this)).val();
		var ssl_type = $('.ssl_type', $(this)).val();
		if (ssl_period && ssl_type) {
			$('.tld-price-ssl-certificate', $(this))
				.attr('price', ssl_certificates[ssl_type]['prices'][ssl_period][currency])
				.html(sprintf(currency_symbols[currency] + '%0.2f', ssl_certificates[ssl_type]['prices'][ssl_period][currency]));
		}
	});
}

function select_upgrade(upgrade) {
	var price_el = upgrade.parent().next();

	if (upgrade.val() == '') {
		price_el.empty().attr('price', 0);
		return;
	}
	
	if (!upgrade.is(':visible')) {
		price_el.empty().attr('price', 0);
		return;
	}
	
	var plan = upgrade.attr('plan');
	var plan_id = $('select[name="plan[' + plan + ']"]').val();
	var upgrade_product = upgrade.attr('is_panel') ? upgrade.val() : upgrade.attr('upgrade');
	var dc = $('select[name="datacenter[' + plan + ']"]').val();

	if (dc == 'sis_group' && typeof upgrades_au[plan][plan_id][upgrade_product]['1'][currency] != 'undefined') {
		var amount = upgrades_au[plan][plan_id][upgrade_product]['1'][currency];
	} else {
		var amount = upgrades[plan][plan_id][upgrade_product]['1'][currency];
	}

	if (!isNaN(parseFloat(upgrade.val())) && parseFloat(upgrade.val()) !== upgrade.val()) {
		amount = amount * parseFloat(upgrade.val());
	}

	if (!upgrade.attr('id').match(/dedicated_installation_troubleshooting/)) {
		amount = parseFloat(amount) * getPeriod($('#' + plan + '_settings')).val();
	}

	price_el.html('<span class="currency-symbol">' + currency_symbols[currency] + '</span>' + sprintf('%0.2f', amount) + ' <span class="currency">' + currency + '</span>').attr('price', amount);
}

function cancel_order() {
	$("a[product_type='" + order_params['product_type'] + "']").click();
	$("select.plans", panel).val(order_params['plan']).change();
	$("input.periods[value='" + order_params['period'] + "']", panel).click();
	$('input.currencies_' + order_params['currency'] + ':first', panel).click();
	
	$('#username').val(order_params['username']);
	$('#client_firstname').val(order_params['firstname']);
	$('#client_lastname').val(order_params['lastname']);
	$('#client_address1').val(order_params['address1']);
	$('#client_address2').val(order_params['address2']);
	$('#client_city').val(order_params['city']);
	$('#client_state').val(order_params['state']);
	$('#client_state_us').val(order_params['state_us']);
	$('#client_zip').val(order_params['zip']);
	$('#client_email').val(order_params['email']);
	$('#client_phone').val(order_params['phone']);
	$('#client_country').val(order_params['country']).change();
	if (order_params['eu'] == 1)
		$("input.is_business[value='" + order_params['is_business'] + "']").click();
	select_owner_details();

	if (order_params['product_type'] == 'vps' || order_params['product_type'] == 'dedicated') {
		$("input[name='" + order_params['product_type'] + "\\[hostname\\]']").val(order_params[order_params['product_type']]['hostname']);
		$("input[name='" + order_params['product_type'] + "\\[os\\]']").val(order_params[order_params['product_type']]['os']);
		$("input[name='" + order_params['product_type'] + "\\[rootpass\\]']").val(order_params[order_params['product_type']]['rootpass']);
		$("input[name='" + order_params['product_type'] + "_repass']").val(order_params[order_params['product_type']]['rootpass']);
		for (var k in order_params['upgrades'])
			$('#' + order_params['product_type'] + '_' + k).val(order_params['upgrades'][k]).change();
	}
	
	if (order_params['host_domain'] == 1) {
		$('host_domain_option a').click();
		$("input[name='hosted_domain']", $('#Host_Domain')).val(order_params['hosted_domain']);
	} else if (order_params['domains']) {

		var contacts = ['country', 'firstname', 'lastname', 'organizationname', 'jobtitle', 'address1', 'address2', 'city', 'stateprovince', 'stateprovince_us', 'postalcode', 'emailaddress', 'phone', 'fax'];

		for (i = 0; i < contacts.length; i++) {
			$('#registrant' + contacts[i]).val(order_params['registrant' + contacts[i]]);
			$('#admin' + contacts[i]).val(order_params['admin' + contacts[i]]);
			$('#tech' + contacts[i]).val(order_params['tech' + contacts[i]]);
			$('#billing' + contacts[i]).val(order_params['billing' + contacts[i]]);
		}

		$("input.copyadmin[value='" + order_params['copyadmin'] + "']", $('#whois_form')).click();
		$("input.copytech[value='" + order_params['copytech'] + "']", $('#whois_form')).click();
		$("input.copybilling[value='" + order_params['copybilling'] + "']", $('#whois_form')).click();

		var dom;
		for (var i in order_params['domains']) {
			dom = order_params['domains'][i];
			domainCheck(dom.substring(0, dom.indexOf('.')), dom.substring(dom.indexOf('.') + 1), function(dom){
				$("select[name='period\\[" + dom + "\\]']").val(order_params['domain_periods'][dom]).change();
				if (order_params['id_protect'] && order_params['id_protect'][dom])
					$("input[name='idp\\[" + dom + "\\]']").click();
				choose_domains();
				updateTotalPrices();
			});
		}
		/*
		for (dom in order_params['domain_periods']) {
			$("input[name='period\\[" + dom + "\\]']").val(order_params['domain_periods'][dom]).click();
		}
		if (order_params['id_protect']) {
			for (dom in order_params['id_protect']) {
				$("input[name='idp\\[" + dom + "\\]']").click();
			}
		}
		choose_domains();
		*/
		if (order_params['extra_attributes']) {
			for (dom in order_params['extra_attributes']) {
				extra_attributes[dom] = order_params['extra_attributes'][dom];
			}
		}
		if (order_params['promo'])
			$("input.choose_promo[value='" + order_params['promo'] + "']").click();
	}
	
	if (order_params['datacenter'])
		$('#' + order_params['product_type'] + '_datacenter').val(order_params['datacenter']);

	if (order_params['script_id'])
		$('#' + order_params['product_type'] + '_script_id').val(order_params['script_id']);

	if (order_params['cc_type'])
		$("input[name='cc_type']").filter("[value='" + order_params['cc_type'] + "']").click();

	$('#pm_' + order_params['payment_method']).click();
}

function phone_format(phone, code) {
	var phone_regex = /^\+\d{1,3}\.\d{4,12}$/;
	if (phone.match(phone_regex))
		return phone;

	phone = phone.replace(/[()]+/g, ' ');
	phone = $.trim(phone);
	if (phone == '')
		return '';

	phone = phone.replace(/^0{2,}/, '+');
	var country_code = phone.match(/^\+(\d{1,3})( |\-|\.)/);
	if (country_code !== null)
		code = country_code[1];

	phone = phone.replace(/^0+/, '');
	phone = phone.replace(/[^\d]+/g, '');
	var phone_match = new RegExp('^' + code + '(\\d+)$');
	phone_match = phone.match(phone_match);
	if (phone_match === null) {
		return '+' + code + '.' + phone;
	} else {
		return '+' + code + '.' + phone_match[1];
	}
}

var pre_domains_search = false;
function pre_domains(sld, tld) {
	$('#first_sld').val(sld);
	$('#first_tld').val(tld);

	//var searched = punycode.toASCII($.trim($('#first_sld').val()).toLowerCase().replace(/^www\./, '')).match(/([a-z0-9-]+)(?:\.([a-z0-9-.]+))?$/);
	
	var _searched = $.trim($('#first_sld').val() + '.' + $('#first_tld').val()).toLowerCase().replace(/^www\./, '');
	var searched = (window.punycode ? punycode.toASCII(_searched) : _searched).match(/([a-z0-9-]+)(?:\.([a-z0-9-.]+))?$/);
	
	if (searched && searched[1]) {
		$('#first_sld').val((window.punycode ? punycode.toUnicode(searched[1]) : searched[1]));
		if (searched[2]) {
			$('#first_tld').val(searched[2]).change();
		}
		
		if ($('#first_sld').val() + '.' + $('#first_tld').val() != $('#sld').val()) {
			pre_domains_search = true;
			var _domain = $('#first_sld').val() + '.' + $('#first_tld').val();
			
			$('#sld').val(window.punycode ? punycode.toUnicode(_domain) : _domain);
			$('#domain_search_form').submit();
			//setTimeout('choose_domains();', 2000);
		}
	}
}

function getQueryParams(qs) {
	if (typeof qs == 'undefined') qs = location.search
    qs = qs.split('+').join(' ');

    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
}

var panel = null;
var extra_attributes = {};
//var upgrades = {};

create_dialog($('#domain_dialog'));
var features_buttons = {};
features_buttons[close_msg] = function() { $(this).dialog('close') };
create_dialog($('#features_dialog'), { 'buttons' : features_buttons });
create_dialog($('#terms_dialog'), { 'buttons' : features_buttons, 'width' : 900, 'height' : 600 });

//kriss
	function set_the_tax() {
		var tax_text = $('#payment-block span.selected a').data('tax-text') || '';
		if (typeof tax_text === 'undefined' || tax_text == '') {
			$('#the_amount, #the_tax').hide();
		} else {
			$('#the_amount, #the_tax').show();
		}

		var tax = $('#payment-block span.selected a').data('tax');

		if (tax_text == '') {
			$('#tax_name').parent().parent().hide();
			$('#amount').parent().hide();
		} else {
			if (tax > 0) {
				$('#tax_name').html(tax_text);
				$('#vat_percent').html(tax + '%');
				$('#tax_name').parent().parent().show();
				$('#amount').parent().show();
			}
		}
		/*
		if ($('input#tax_group').val() == 'us' 
				&& $('#client_country option:selected').val() == 'US' 
				&& $('#client_state_us option:selected').val() == 'FL') {
			$('#tax_name').html($('#client_country option:selected').attr('us_human'));
		} else if ($('input#tax_group').val() == 'uk' && $('#client_country option:selected').attr('euro') == 1) {
			if ($('input.is_business:checked').val() == 1) {
				$('#tax_name').html($('#client_country option:selected').attr('uk_business_human'));
			} else {
				$('#tax_name').html($('#client_country option:selected').attr('uk_not_business_human'));
			}
		}*/
	}

$(function(){

	dedicated_servers_assembly_delay = [60554, 60557];

	old_sld = ($('[name="sld"]').length ? $('[name="sld"]').val() : '');
	 
	$('[name="sld"], #first_sld').on('keyup', function() {
		if (old_sld != $(this).val()) {
			if ($(this).val() == '') {
				old_sld = '';
				return;
			}
			
			var new_sld = domain_search_get_sld($(this).val());
			$(this).val(window.punycode ? punycode.toUnicode(new_sld) : new_sld);
		}
		if (window.langtag_required_func)
			langtag_required_func();
	});		

	set_the_tax();
	
	$('#domain_dialog').dialog({ 'open' : function(event, ui){
		var _searched = $.trim($('#first_sld').val()).toLowerCase().replace(/^www\./, '');
		var searched = (window.punycode ? punycode.toASCII(_searched) : _searched).match(/([a-z0-9-]+)(?:\.([a-z0-9-.]+))?$/);
		if (searched && searched[1]) {
			$('#first_sld').val(window.punycode ? punycode.toUnicode(searched[1]) : searched[1]);
			if (searched[2]) {
				$('#first_tld').val(window.punycode ? punycode.toUnicode(searched[2]) : searched[2]);
			}
			if ($('#first_sld').val() + '.' + $('#first_tld').val() != $('#sld').val()) {
				var _domain = $('#first_sld').val() + '.' + $('#first_tld').val();
				$('#sld').val(window.punycode ? punycode.toUnicode(_domain) : _domain);
				//$('#sld').val(punycode.toUnicode($('#first_sld').val()));
				$('#domain_search_form').submit();
			}
		}
	} });

	if ($('#owner_dialog')[0]) {
		var owner_buttons = {};
		owner_buttons[close_msg] = function() { $(this).dialog('close') };
		owner_buttons[continue_msg] = function() {
			var thiz = $(this);
			do_proceed = function() {
				if (!validate_all($('#owner_form'))) {
					//showMsg('error', invalid_owner_details_msg);
					return;
				}

				select_owner_details();
				thiz.dialog('close');
			}

			if (validate_count == 0) {
				do_proceed();
				do_proceed = undefined;
			}
		};
		create_dialog($('#owner_dialog'), { 'width' : 600, 'buttons' : owner_buttons });

		$('#add_owner_details').click(function(){
			$('#owner_dialog').dialog('open');
		});
	}

	vtip();

	$(document).on('click','div.tabs-new span a', function(e) {
		var id = $(this).attr('href').replace('#', '');
		var tabs_head = $(this).parent().parent();
		var tabs_content = tabs_head.next();

		tabs_head.children().removeClass('ui-corner-top ui-widget-content selected');
		$(this).parent().addClass('clickedTab ui-corner-top ui-widget-content selected');
		tabs_content.children().css('display', 'none');

		if ($(this).attr('load')) { // ajax load
			//if (!$('#' + id)[0]) // if container is missing add it
			//	tabs_content.append('<div id="' + id + '"></div>');
		//	if ($('#' + id).text() == '') // if container is empty load
		//		loadSafe($('#' + id), $(this).attr('load'));
		}

		$('#' + id).css('display', '');
		
		if ($.inArray(id, ['Plans', 'Semi_Dedicated']) > -1) {
			$('#trial-info section').hide();
			$('#trial-info section.' + id.toLowerCase().replace('_', '-')).show();
			$('#trial-info').show();
		} else
			$('#trial-info').hide();

		// set price for selected upgrades
		$('select.upgrades:visible').each(function() { 
			if ($(this).val() != '') 
				select_upgrade($(this)); 
		});
		
		vps_warnings();
		e.preventDefault();
		
		if (id == 'Dedicated')
			show_hide_dedicated_storage_config();
	});

	$('a[product_type]', $('#products-block')).click(function(){
		panel = $($(this).attr('href'));
		$('#product_type').val($(this).attr('product_type'));
		toggle_host_domain($(this).attr('host_domains'));
		
		if ($(this).attr('href') == '#Dedicated') {
			$('.assembly_time_note').hide();
			if ($.inArray(parseInt($(this).val()), dedicated_servers_assembly_delay) > -1)
				$('.assembly_time_note').show();
		}
		
		if (panel.text() != '') {
			choose_promo(promo_domain);
			updateTotalPrices();
			$('#first_tld').change();
		}
		
		if (panel.attr('id') == 'SSL') {
			$('#SSL select[name="ssl_data[period]"]').trigger('change');
		}
		
		if (!$('#promo_code').is(':visible'))
			$('#promo_code').show();
		else if ($(this).attr('product_type') == 'dedicated') {
			setTimeout(function() {
				panel.find('input[name^="period[dedicated]"]:visible:checked').trigger('click');
			}, 500);
		}
	});

	$('#register_domains_option,#host_domain_option').click(function(){
		if ($(this).attr('id') == 'host_domain_option') {
			$('#host_domain').val(1);
		} else {
			$('#host_domain').val(0);
		}
	});
	
	$('select[name^="datacenter"]').on('change', function() {
		vps_warnings();
		// recalculate prices for dc
		$('select.upgrades:visible').each(function() { 
			if ($(this).val() != '') {
				select_upgrade($(this)); 
				updateTotalPrices();
			}
		});			
	});

	$('select.plans').on('change', function(e) {
		checked_period = $('#periods_' + $(this).val() + ' input:checked').val();
		$('div.features:visible', panel).css('display', 'none');
		$('#features_' + $(this).val()).css('display', '');

		show_hide_dedicated_storage_config();

		$('div.prices:visible', panel).css('display', 'none');
		$('#price_' + $(this).val() + '_' + checked_period).css('display', '');
		$('div[id^="period"]:visible', panel).css('display', 'none');
		$('#periods_' +$(this).val()).css('display', '');

		$('select.upgrades:visible').each(function(){ 
			select_upgrade($(this)); 
		});

		choose_promo(promo_domain);
		updateTotalPrices();
		$('#first_tld').change();
		check_upgrades();
	});
	
	$('input[name="promo_code"]').on('change', function() {
		updateTotalPrices();
	}).on('keypress', function(e) {
		if (e.keyCode == 13) {
			e.preventDefault();
			$(this).blur();
		}
	});	

	function check_upgrades(selected_panel) {
		if (!selected_panel)
			selected_panel = panel;

		var option = $('select.plans option:selected', selected_panel);
		for (var i = 0; i < plan_included_upgrades.length; i++) {
			if (plan_included_upgrades[i] != 'control_panel') {
				if (option.attr(plan_included_upgrades[i])) {
					$('div.' + plan_included_upgrades[i] + '_block', selected_panel).hide();
					$('select.' + plan_included_upgrades[i], selected_panel).val('').parent().next().empty().attr('price', 0);
				} else {
					$('div.' + plan_included_upgrades[i] + '_block', selected_panel).show();
				}
			}
		}
		
		// hide backup if managed services is selected
		if (selected_panel.find('select[name$="\[managed_services\]"]').val() != '') {
			selected_panel.find('select[name$="\[backup\]"]').parent().parent().hide();
		}
	}

	$('input.periods').on('click', function(){
		$('div.prices:visible', panel).css('display', 'none');
		$('#price_' + $('select.plans', panel).val() + '_' + $(this).val()).css('display', '');

		$('label', $(this).closest('div')).css('font-weight', 'normal');
		$(this).closest('label').css('font-weight', 'bold');

		//$('select.upgrades').each(function(){ select_upgrade($(this)); });

		$('select.upgrades:visible').each(function() { 
			if ($(this).val() != '') {
				select_upgrade($(this)); 
			}
		});
		
		$('select[name^="storage_configuration"]:visible').change();

		// check for dedicated tab clicked and period 1
		if (panel.attr('id') == 'Dedicated') {
			if ($(this).val() > 1) {
				$('#promo_code input[name="promo_code"]').val('');
				$('#promo_code').hide();
			} else
				$('#promo_code').show();
		}

		choose_promo(promo_domain);
		updateTotalPrices();
		
		$('#first_tld').change();
	});

	$('input.currencies').on('click', function(){
		currency = $(this).val();

		$('input.currencies', $('#products-block')).parent().css('font-weight', 'normal');
		$('input.currencies_' + currency, $('#products-block')).prop('checked', true).parent().css('font-weight', 'bold');
		$(this).parents('.prices').find('.full_price').html(currency_symbols[currency] + $(this).attr('full-price'));
		
		$('select.upgrades:visible').each(function() { 
			if ($(this).val() != '') {
				select_upgrade($(this)); 
			}
		});		
		
		$('select[name^="storage_configuration"]:visible').change();

		updateDomainPrices();
		choose_promo(promo_domain);
		updateTotalPrices();
		$('#first_tld').change();
	});
	//setTimeout("$('input.currencies:checked:first').click()", 1);

	$('select.managed_services').on('change', function(){
		if ($(this).val() == 1) {
			$('select.backup', panel).val('').parent().next().empty().attr('price', 0);
			$('div.backup_block', panel).css('display', 'none');
		} else {
			$('div.backup_block', panel).css('display', '');
		}
	});

	$('select.upgrades').on('change', function(e) {
		select_upgrade($(this));
		updateTotalPrices();
	});
	
	$('#first_tld').change(function(){
		var opt = getSelectedPlanOption();
		var curr = getCurrency().val();
		var plan_period = getPeriod().val();
		var tld = $(this).val();
		
		var price_option = 'prices_register';
		if ('undefined' == typeof registerdomainProducts[tld][price_option])
			price_option = 'prices';
		for (var first_period in registerdomainProducts[tld][price_option])
			break;

		var human_period = parseInt(first_period.replace('period_', '')) / 12;
		human_period = human_period + ' ' + (human_period == 1 ? year_msg : years_msg);

		var rd_price = sprintf('%0.2f', registerdomainProducts[tld][price_option][first_period][curr]);

		if (plan_period > 1 && opt.attr('free') == '1') {
			//one free domain registration
			if (domainProducts[tld]) {
				if (is_tld_free(tld)) {
					$('#tld_price').html(currency_symbols[curr] + rd_price + ' / ' + human_period + ' (1 ' + free_domain_registration_msg + ')');
				} else {
					var promo_price = sprintf('%0.2f', domainProducts[$(this).val()]['prices'][first_period][curr]);
					
					$('#tld_price').html(currency_symbols[curr] + rd_price + ' / ' + human_period + ' (1 ' + promo_domain_registration_msg + ' @ ' + currency_symbols[curr] + promo_price + ')');
				}
			} else {
				var ast = '';
				if (domainsInfo[tld]['is_promo'])
					ast = '*';

				$('#tld_price').html(currency_symbols[curr] + rd_price + ast + ' / ' + human_period);

				if (domainsInfo[tld]['is_promo'])
					$('#tld_price').append(' <span style="display: block">' + promo_domain_asterix_msg + '</span>');
			}
			$('div.plan_promo_domain').css('visibility', 'visible');
		} else if (plan_period > 1 && opt.attr('free') == '0') {
			//one promo domain registration
			if (domainProducts[tld]) {
				var promo_price = sprintf('%0.2f', domainProducts[$(this).val()]['prices'][first_period][curr]);
				$('#tld_price').html(currency_symbols[curr] + rd_price + ' / ' + human_period + ' (1 ' + promo_domain_registration_msg + ' @ ' + currency_symbols[curr] + promo_price + ')');
			} else {
				var ast = '';
				if (domainsInfo[tld]['is_promo'])
					ast = '*';

				$('#tld_price').html(currency_symbols[curr] + rd_price + ast + ' / ' + human_period);

				if (domainsInfo[tld]['is_promo'])
					$('#tld_price').append(' <span style="display: block">' + promo_domain_asterix_msg + '</span>');
			}
			$('div.plan_promo_domain').css('visibility', 'visible');
		} else {
			//registerdomain price only
			$('#tld_price').html(currency_symbols[curr] + rd_price + ' / ' + human_period);
			//var ast = '';
			//if (domainsInfo[tld]['is_promo'])
			//	ast = '*';

			//$('#tld_price').html(currency_symbols[curr] + rd_price + ast + ' / ' + human_period);

			//if (domainsInfo[tld]['is_promo'])
			//	$('#tld_price').append(' <span style="display: block">' + promo_domain_asterix_msg + '</span>');

			$('div.plan_promo_domain').css('visibility', 'hidden');
		}
	});

	$('a.show_all_features').on('click', function(){
		loadSafe($('#features_dialog'), 'ajax.php?action=features&product_type=' + $('#product_type').val() + '&plan_id=' + $('select.plans', panel).val() + '&currency=' + getCurrency().val(), function(){
			$('#features_dialog').dialog('open');	
		});
		return false;	
	});

	$('select.os_options').on('change', function(){
		var obj = $(this)[0];
		var plan = $(this).attr('plan');
		var panels = obj.options[obj.selectedIndex].getAttribute('panels').split(';');
		if (plan == 'vps' && !$('#vps_plan option:selected').attr('control_panel'))
			panels = ['None', 'Hepsia'];
		var html = '';
		for (var i = 0; i < panels.length; i++)
			html = html + '<option value="' + (panels[i] == 'None' ? '' : panels[i]) + '"' + (panels[i] == 'Hepsia' ? ' selected="1"' : '') + '>' + panels[i]  + '</option>';

		$('#' + plan + '_panel').html(html);
		$('#' + plan + '_panel').change();
	});

	$('input.valid-phone').on('change', function(){
		var country_id = $(this).attr('id').replace('phone', 'country').replace('fax', 'country');
		$(this).val(phone_format($(this).val(), $('#' + country_id + ' option:selected').attr('phone_code')));
	});

	$('body').on('change', 'input.validate,select.validate', function(){
		validate_input($(this));
	});

	$('#domain_check').click(function(){
		if ($('#domain_dialog').text() == '') {
			loadSafe($('#domain_dialog'), 'ajax.php?action=domain_check_box', function(){
				$('#domain_dialog').dialog('open');
				owner_details(); //if owner details & no whois details, set
			});
		} else {
			back_action();
			$('#domain_dialog').dialog('open');
			owner_details(); //if owner details & no whois details, set
		}
	});

	$('#first_sld').keydown(function(e){
		if (e.keyCode == 13) {
			$('#domain_check').click();
			return false;
		}
	});

	$('#client_country, #client_state_us, #client_state, [name^="plan\["], [name^="period\["]').on('change', function() {
		var get_period_value = $('#products-block > .ui-widget-content > div:visible input[name^="period\["]:checked').val();
		get_payment_methods_new(get_period_value);
		get_tax(get_period_value);
		
		if ($(this).attr('name') == 'plan[dedicated]') {
			$('.assembly_time_note').hide();
			if ($.inArray(parseInt($(this).val()), dedicated_servers_assembly_delay) > -1)
				$('.assembly_time_note').show();
		}
		
		$('select.upgrades:visible').each(function() { 
			if ($(this).val() != '') 
				select_upgrade($(this)); 
		});		
		
		// trigger change for dedicated disk
		if ($('select[name^="storage_configuration"]:visible').length) {
			$.each($('select[name^="storage_configuration"]:visible'), function() {
				$(this).change();
			});
		}
	});
	$('a[id^="A_"]').on('click', function() {
		var get_period_value = $('input[name^="period\[' + $(this).attr('product_type') + '\]"]:checked').val();
		get_tax(get_period_value);
	});
	$('table#selected_domains_table').on('click', 'td.remove_selected_domain', function() {
		var get_period_value = $('#products-block > .ui-widget-content > div:visible input[name^="period\["]:checked').val();
		get_tax(get_period_value)
	});


	$('#client_country').change(function(){

		var selected_option = $(this)[0].options[$(this)[0].selectedIndex];
		if (selected_option.value == 'US') {
			$('#client_state_div').css('display', 'none');
			$('#client_state_us_div').css('display', '');
		} else {
			$('#client_state_us_div').css('display', 'none');
			$('#client_state_div').css('display', '');
		}
		if (selected_option.getAttribute('euro') == 1) { //kriss.uglyfix
			if ($('input[name="account_owner_details"]:checked')) {
				$('div.hide_details').css('display', ''); //new
			} else {
				$('div.hide_details').css('display', 'none'); //new
			}
			//$('input.is_business').attr('checked', false); //new
			$('#business_options').css('display', ''); //new
			//toggle_business($('input.is_business:checked').val()); //old
			$('#eu').val(1);
			$('#euro_amounts').css('display', '');
		} else {
			$('div.hide_details').css('display', ''); //new
			$('#business_options').css('display', 'none');
			$('#vat_number').css('display', 'none');
			$('#eu').val(0);
			$('#euro_amounts').css('display', 'none');
		}
		updateTotalPrices();
	});



	$('input.is_business').on('click', function(){
		$('div.hide_details:hidden').css('display', '') //new;
		toggle_business($(this).val());
		updateTotalPrices();

		//var get_period_value = $('#products-block > .ui-widget-content > div:visible input[name^="period\["]:checked').val();
		var get_period_value = getPeriod().val();

		get_payment_methods_new(get_period_value);
		get_tax(get_period_value);
	});

	$('#orderForm').submit(function() {
		var thiz = $(this);
		
		do_proceed = function() {
			if (pre_domains_search)
				owner_details();

			if (!validate_all(thiz)) {
				//showMsg('error', invalid_owner_details_msg);
				return;
			}

			if (!$('#redirect_payment_div')[0])
				$(document.body).append('<div id="redirect_payment_div" style="display:none"></div>');

			var extra_params = '';
			for (var i in extra_attributes)
				extra_params = extra_params + '&' + extra_attributes[i];

			//loadSafe($('#redirect_payment_div'), 'ajax.php?action=submit_order', thiz.serialize() + '&' + $('#whois_form').serialize() + '&' + $('#owner_form').serialize() + extra_params);
			var plan_params = $("input[type='hidden'],input:visible,select:visible", thiz).serialize();
			loadSafe($('#redirect_payment_div'), 'ajax.php?action=submit_order', plan_params + '&' + $('#whois_form').serialize() + '&' + $('#owner_form').serialize() + extra_params);
		}

		if (validate_count == 0) {
			do_proceed();
			do_proceed = undefined;
		}

		return false;
	});

	$('a.terms').click(function(){
		var product_type_to_terms = { 'domain_names': 'hosting', 'plans': 'hosting', 'semi_dedicated': 'semi', 'vps': 'vps', 'solusvm' : 'vps', 'dedicated': 'dedicated' };
		var product_type_terms = product_type_to_terms[$('#product_type').val()];

		if ($('#terms_dialog').text() == '') {
			var thiz = $(this);
			loadSafe($('#terms_dialog'), 'ajax.php?action=terms', null, function(){
				$('#terms_dialog').dialog('open');
				var s = thiz.attr('s');
				var l = thiz.attr('l');
				if (s.substring(0, 1) == '_') {
					s = product_type_terms + s;
					l = product_type_terms + l;
				}
				$('#' + s).click();
				$('#' + l).click();
			});
		} else {
			$('#terms_dialog').dialog('open');
			var s = $(this).attr('s');
			var l = $(this).attr('l');
			if (s.substring(0, 1) == '_') {
				s = product_type_terms + s;
				l = product_type_terms + l;
			}
			$('#' + s).click();
			$('#' + l).click();
		}
		return false;
	});

	$('#payment-block').on('click', 'input.choose_pm,a.choose_pm', function(){
		if ($(this).attr('pm')) {
			$('#payment_method').val($(this).attr('pm'));
			$('#tax_group').val($(this).attr('tax_group'));
			if (this.nodeName.toLowerCase() == 'input') {
				$('#all_pm > div:visible').hide();
				$('#' + $(this).attr('pm')).show();
			}
		}
		$('label', $(this).closest('div')).css('font-weight', 'normal');
		$(this).closest('label').css('font-weight', 'bold');
	});
//kriss
	$(document).on('click', 'a.choose_pm', function(){
		if (!$('input[name=account_owner_details]').is(':checked')) {
			if ($('#client_country option:selected').attr('euro') == 1) {
				//$('div.hide_details').css('display', 'none'); //new
				//$('input.is_business').attr('checked', false); //new
				$('#business_options').css('display', ''); //new
				$('[name="is_business"]:selected').trigger('click');
			} else {
				//$('div.hide_details').css('display', ''); //new
				$('#business_options').css('display', 'none');
				$('#vat_number').css('display', 'none');
			}
		}
		toggle_business($('input[name="is_business"]:checked').val());
		updateTotalPrices();
		set_the_tax();
	});
	$(document).on('change', '#client_country', function(){
			updateTotalPrices();
			set_the_tax();
			});
	$(document).on('change', '#client_state_us', function(){
			updateTotalPrices();
			set_the_tax();
			});

	$('#email_notification_settings input').click(function(){
		$('label', $(this).closest('div')).css('font-weight', 'normal');
		$(this).closest('label').css('font-weight', 'bold');		
	}).first().click();

	$('input.currencies:checked:first').click();

	//choose tab
	var hash = get_hash();
	var allowed_hash_keys = [];
	$.each($('#products-block .tabs-new a'), function() {
		allowed_hash_keys.push($(this).text());	
		if ($.inArray($(this).attr('href').substring(1), allowed_hash_keys) < 0)
			allowed_hash_keys.push($(this).attr('href').substring(1));
	});
	
	if (Object.keys(hash).length >= 1) {
		var _hash = (Object.keys(hash).length == 1) ? hash[0] : hash[1];
		if ($.inArray(_hash, allowed_hash_keys) >= 0)
			$("a[href='#" + _hash + "']", $('#products-block')).click(); //from url
		else
			$("a[product_type]:first", $('#products-block')).click(); //default
	} else {
		$("a[product_type]:first", $('#products-block')).click(); //default
	}
   
	//choose plan
	if (hash.length > 2 && hash[2].length > 0) {
		var option = $("option[plan_name='" + hash[2] + "']", $('select.plans', panel));
		if (option[0]) {
			option.attr('selected', true);
			$('select.plans', panel).change();
			//setTimeout("$('select.plans', panel).change()", 1);
		}
	}

	//search domain
	if (hash.length > 4 && hash[4].length > 0)
		$('#first_tld').val(hash[4]);

	if (hash.length > 3 && hash[3].length > 0) {
		$('#first_sld').val(window.punycode ? punycode.toUnicode(hash[3]) : hash[3]);
		//$('#domain_check').click();
		setTimeout("$('#domain_check').click();", 1);
	}

	//comming from remote domain search form
	if (domain_search_params.plan != '') {
		var sel = $("select.plans option[value='" + domain_search_params.plan + "']").parent();
		$('#A_' + sel.parent().parent().parent().attr('id')).click();
		sel.val(domain_search_params.plan).change();
	}

	if (domain_search_params.stop_search == '' || domainsInfo[domain_search_params.tld]['extra_attributes']) {
		if (domain_search_params.tld != '') $('#first_tld').val(domain_search_params.tld).change();
		if (domain_search_params.sld != '') {
			$('#first_sld').val(window.punycode ? punycode.toUnicode(domain_search_params.sld) : domain_search_params.sld);
			//$('#domain_check').click();
			setTimeout("$('#domain_check').click();", 1);
		}
	} else {
		if (domain_search_params.tld && domain_search_params.sld)
			pre_domains(domain_search_params.sld, domain_search_params.tld);
	}

	if (domain_search_params.country != '')
		$('#client_country').val(domain_search_params.country.match(/[A-Z]{2}/)).change();
	if (domain_search_params.script != '')
		$('#plans_script_id').val(domain_search_params.script);

	if (domain_search_params.ssl != '') {
		if ($('select[name="ssl_data[type]"] option[data-product-id="' + domain_search_params.ssl + '"]').length) {
			$('select[name="ssl_data[type]"] option[data-product-id="' + domain_search_params.ssl + '"]').prop('selected', true);
			$('a[href="#SSL"]').trigger('click');
		}
	}
	
	if ($('#products-block .tabs-new span.selected a').attr('product_type') == 'dedicated')
		show_hide_dedicated_storage_config();
	
	check_upgrades($('#VPS'));
	check_upgrades($('#SOLUSVM'));
	check_upgrades($('#KVM'));

	$('select[name^="raid"]').on('change', function() {
		var new_val = $(this).val();
		var option = $(this).find('option[value="' + new_val + '"]');
		if (option.data('no-redundancy') == '1') {
			$('.raid_no_redundancy_notification').show();
		} else {
			$('.raid_no_redundancy_notification').hide();
		}
	});
		
	$('select[name^="storage_configuration"]').on('change', function() {
		var new_val = $(this).val();
	
		// check if default disk
		/*
		if ($(this).data('disk-type') == 'default') {
			var current_slot = $(this).prop('name');
			
			$.each($(this).parent().parent().find('select[data-disk-type="default"]'), function(k, v) {
				if ($(this).prop('name') != current_slot) {
					if ($(this).val() != new_val)
						$(this).val(new_val).trigger('change');
				}
			});
		}
		*/
		
		var price_element = $(this).parent().find('.slot-price');
		var default_disk = $(this).find('option[data-price="0"]');
		var default_disk_price = default_disk.data('default-price-' + currency.toLowerCase()) || 0;

		var period = getPeriod().val();
		
		if ($(this).find('option[value="' + new_val + '"]').length) {
			var new_disk_price = $(this).find('option[value="' + new_val + '"]').data('price-' + currency.toLowerCase());
			if (typeof new_disk_price != 'undefined') {

				if (new_disk_price > 0) {
					var price = (new_disk_price - default_disk_price) * period;
					price_element.html(' + ' + sprintf(currency_symbols[currency] + '%0.2f ' + currency, (Math.round((price) * 100) / 100)));
				} 
			} else {
				price_element.html('');
			}
			
			updateTotalPrices();
		}
		
		dedicated_raid_options();
	});
	
	if (location.search != '') {
		// get parameters
		var params = getQueryParams();
		if (typeof params['period'] != 'undefined') {
			// set period
			$('input[name^="period"][value="' + params['period'] + '"]:visible').click();
		}
	}
});
/*$(function() {
var values = {};
	$('.remember').each(function() {
		$(this).change(function() {
			$.post('ajax.php?action=remember&name=' + $(this).attr('name') + '&value=' + $(this).val(), function() {});
		});
	});
});*/

/* kriss */
if ($('input[name="account_owner_details"]').length > 0) {
	$('#the_details').css({'visibility' : 'hidden', 'position' : 'absolute'});
}
$('input[name="account_owner_details"]').on('change', function() {
	if ($(this).is(':checked')) {
		$('#the_details').css({'visibility' : 'hidden', 'position' : 'absolute'});
		if (typeof fill_the_details != 'undefined') {
			fill_the_details();
		}
	} else {
		$('#the_details').css({'visibility' : 'visible', 'position' : 'relative'});
		//$('#the_details input[type="text"]').val('');
	}
	updateTotalPrices();
	set_the_tax();
});
/* kriss */


$(function(){
	$(".tabs-new span").click(function() {
		parentSpan = $(this).closest("span");
		parentSpan.hasClass("selected")?(
			parentSpan.removeClass("selected")
		):(
			parentSpan.addClass("clickedTab"), 
			parentSpan.siblings().removeClass("clickedTab")
		)
		//$.post('ajax.php?action=remember&name=currTab' + '&value=' + $('.tabs-new span.clickedTab a').attr('id'), function() {});
	});

	var tab = $('#products-block').attr('currTab');
	$(".tabs-new a#" + tab).trigger('click');
});

$(function() {	

	$(".remp span").click(function() {
		parentSpan = $(this).closest("span");
		parentSpan.hasClass("selected")?(
			parentSpan.removeClass("selected")
		):(
			parentSpan.addClass("clickedTab"), 
			parentSpan.siblings().removeClass("clickedTab")
		)
		//$.post('ajax.php?action=remember&name=pmethod' + '&value=' + $('.remp span.clickedTab a').attr('pm'), function() {});
	});

	var ptab = $('#payment-block').attr('pmethod');
	$(".tabs-new a[pm=" + ptab +"]").trigger('click');
});

$(function() {

	var bc = $('#business_options').attr('bc');
	var currCountry = $('#client_country').attr('currCountry');

	if(bc == 1 && $('#client_country option:selected').attr("euro") == 1)
        	$('#vat_number').show();
        if(bc == 0) {
        	$('input[name="vat_number"], input[name="company_name"]').removeAttr('value');
        	$('#vat_number').hide();
        }
        if($('#client_country option:selected').attr("euro") == 1)
                $('#business_options').show();
        if(currCountry == 'US') {
                $('#client_state_us_div').show();
                $('#client_state_div').hide();
        } else {
                $('#client_state_us_div').hide();
                $('#client_state_div').show();
        }
});

$(document).ready(function() {
	var get_period_value = $('#products-block > .ui-widget-content > div:visible input[name^="period\["]:checked').val();
	get_payment_methods_new(get_period_value);
	//	console.log(get_period_value);
	get_tax(get_period_value);
	var ms_dedicated = $('#Dedicated .managed_services_block').attr('ms');
	var ms = $('#VPS .managed_services_block').attr('ms');
	var ms_solus = $('#SOLUSVM .managed_services_block').attr('ms');

	if(ms == 1)
		$('#VPS .backup_block').addClass('hidden');

	$('#vps_backup').val('');
	$('#vps_managed_services').change(function() {
    	if($(this).val() == '')
        	$('#VPS .backup_block').removeClass('hidden');
	});

	if(ms_solus == 1)
       	$('#SOLUSVM .backup_block').addClass('hidden');
	
	$('#solusvm_backup').val('');
	$('#solusvm_managed_services').change(function() {
		if($(this).val() == '')
			$('#SOLUSVM .backup_block').removeClass('hidden');
	});

	if(ms_dedicated == 1) {
		$('#Dedicated .backup_block').addClass('hidden');
		$('#dedicated_backup').val('');
	}
		
	$('#dedicated_managed_services').change(function() {
		if($(this).val() == '')
			$('#Dedicated .backup_block').removeClass('hidden');
	});	

	$('input[name="promo_code"]').val($('#promo_code_param').val());
	
	updateTotalPrices();
});

function domain_search_get_sld(sld, strip_last_dash) {
	if ((typeof sld == 'undefined') || (sld == '') || (sld == null) || !sld)
		sld = $.trim($('#sld').val());
	else 
		sld = $.trim(sld);
	
	sld = sld.toLowerCase().replace(/^www\./, '').replace(/^-+/, "").replace(/-{2,}$/, '-');
	
	if (strip_last_dash)
		sld = sld.replace(/-+$/, '');

	return (window.punycode ? punycode.toASCII(sld) : sld);
}

function vps_warnings() {
	$('.au_bandwidth_warning').hide();
	$('.mail_limit_notice').hide();
	
	if (
		($.inArray($('#products-block .tabs-new .selected a').attr('id'), ['A_VPS', 'A_SOLUSVM', 'A_KVM']) >= 0)
	) {
		$('.mail_limit_notice').show();
		if ($('select[name^="datacenter"]:visible').val() == 'sis_group')
			$('.au_bandwidth_warning').show();
	} else if (
		($.inArray($('#products-block .tabs-new .selected a').attr('id'), ['A_Dedicated']) >= 0)
	) {
		$('.mail_limit_notice').show();
	}
}

function show_hide_dedicated_storage_config() {
	var selected_plan = $('select.plans:visible').val();
	$('.dedicated_storage_config .inside').hide();
	
	if (
		$('.dedicated_storage_config #dedicated_storage_config_' + selected_plan).length && 
		$.trim($('.dedicated_storage_config #dedicated_storage_config_' + selected_plan).html()) != ''
	) {
		$('.dedicated_storage_config #dedicated_storage_config_' + selected_plan).show();
		$('.dedicated_storage_config').show();
	} else {
		$('.dedicated_storage_config').hide();
	}

	dedicated_raid_options();
}

function dedicated_raid_options() {
	var selected_plan = $('select.plans:visible').val();

	var default_disks = $('#dedicated_storage_config_' + selected_plan + ' select[data-disk-type="default"]').length;
	if (default_disks == 0) {
		default_disks = $('#dedicated_storage_config_' + selected_plan + ' input[name^="storage_configuration"]').length;
	}
	
	total_disks = 0;

	if (typeof first_disk_size != 'undefined') delete(first_disk_size);
	if (typeof first_disk_type != 'undefined') delete(first_disk_type);

	$.each($('#dedicated_storage_config_' + selected_plan + ' [name^="storage_configuration[' + selected_plan + ']"]'), function(k, v) {
		if ($(this).val() != '') {
			var selected_disk = $(this).find('option[value="' + $(this).val() + '"]');
			
			if ((typeof first_disk_size == 'undefined') && (typeof first_disk_type == 'undefined')) {
				first_disk_size = selected_disk.data('disk-size');
				first_disk_type = selected_disk.data('disk-type');
			}
			
			if (
				(first_disk_size == selected_disk.data('disk-size')) && 
				(first_disk_type == selected_disk.data('disk-type'))
			) {
				total_disks++;
			}
		}
	});

	$('.dedicated_storage_config select[name="raid"] option').each(function() {
		if (typeof $(this).data('required-disks') != 'undefined') {
			var raid_type = $(this).prop('value');
			
			if ($(this).data('required-disks') > total_disks) {
				$(this).prop('disabled', true);
				if ($(this).parent().val() == null || $(this).parent().val() == raid_type) {
					$(this).parent().val($(this).parent().find('option:enabled:last').val()).change();
				}
			} else if ($(this).prop('disabled') == true) {
				$(this).prop('disabled', false);
			}
		}
	});
	
	if (total_disks >= default_disks) {
		if ($('.dedicated_storage_config select[name="raid"]').val() == '') {
			if (default_disks == 2)
				$('.dedicated_storage_config select[name="raid"]').val('raid1');
			else if (default_disks == 4)
				$('.dedicated_storage_config select[name="raid"]').val('raid10');
		}
	}
}
