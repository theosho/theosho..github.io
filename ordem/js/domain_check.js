var tld_list = {
	//"most_popular": {"com":1, "net":1, "org":1},
	"most_popular": {"com":1, "net":1, "org":1, "info":1, "biz":1, "co.uk":1, "com.au":1, "us":1, "ca":1, "de":1, "eu":1, "mobi":1, "we.bs":1},
	"universal": {"com":1, "net":1, "org":1, "info":1, "biz":1, "name":1, "mobi":1, "asia":1, "we.bs":1},
	"country_code": {"us":1, "tv":1, "net.cn":1, "org.cn":1, "cc":1, "cn":1, "me.uk":1, "eu":1, "org.tw":1, "idv.tw":1, "org.uk":1, "ca":1, "com.tw":1, "co.uk":1, "com.cn":1, "com.mx":1, "de":1, "me":1, "in":1, "net.au":1, "net.nz":1, "org.nz":1, "be":1, "jp":1, "nu":1, "tw":1, "se":1, "ws":1, "nl":1, "com.au":1, "co.nz":1, "at":1, "uk":1, "co":1, "co.za":1, "ru":1, "es":1, "it":1, "fr":1, "pl":1, "co.il":1, "ch":1},
	"all":1,
	"none":0
};
var searched = '';
var domainCache = {};
var buttons1 = {};
var buttons2 = {};

old_sld = ($('[name="sld"]').length ? $('[name="sld"]').val() : '');

function back_action() {
	$('#domain_owner_details').css('display', 'none');
	$('#domain_search').css('display', '');
	$('#domain_dialog').dialog('option', 'buttons', buttons1);
}

function owner_details() {
	if (
		($('#registrantfirstname').val() == '' && $('#registrantlastname').val() == '') &&
		($('#selected_owner_details').text() != '' || $('#client_firstname').val() != '' || $('#client_lastname').val() != '') 
	) {
		$('#registrantorganizationname').val($('#client_company_name').val());
		$('#registrantfirstname').val($('#client_firstname').val());
		$('#registrantlastname').val($('#client_lastname').val());
		$('#registrantaddress1').val($('#client_address1').val());
		$('#registrantaddress2').val($('#client_address2').val());
		$('#registrantcity').val($('#client_city').val());
		$('#registrantstateprovince').val($('#client_state').val());
		$('#registrantstateprovince_us').val($('#client_state_us').val());
		$('#registrantpostalcode').val($('#client_zip').val());
		$('#registrantcountry').val($('#client_country').val()).change();
		$('#registrantemailaddress').val($('#client_email').val());
		$('#registrantphone').val($('#client_phone').val());
	}
}

// callback used in cancel url
function domainCheck(sld, tld, callback) {
	if ($('#tlds-results-table tr').length % 2) var evenClass = '';
	else var evenClass = ' even';

	if (!$("#" + sld + '_' + tld.replace(/\./g, '_'))[0])
		$('#tlds-results-table').append(dom_tr_template(sld, tld, evenClass));
			/*		
			'<tr id="' + sld + '_' + tld.replace(/\./g, '_') + '" class="domain_tr' + evenClass + '" tld="' + tld + '">' +
				'<td class="radioTd">' +
					'<input type="checkbox" name="domains[]" class="register_transfer' +
						(domainsInfo[tld]['extra_attributes'] ? ' register_transfer_extra' : '') + '" value="' + sld + '.' + tld + '"' +
						' style="visibility: hidden" id="check_domain_' + sld + '.' + tld + '" />' +
				'</td>' +
				'<td>' +
					'<label for="check_domain_' + sld + '.' + tld + '"><span>' + checking_msg + '</span> ' +
					'<strong>' + punycode.toUnicode(sld + '.' + tld) + '</strong></label>' +
					'<p class="epp"></p>' +
					'<p class="idp"></p>' +
					'<p class="ssl"></p></td>' +
				'<td class="period loading"></td>' +
				'<td class="sum">' +
					'<span class="tld-price"></span>' +
					//'<p class="tld-price-id-protect"></p>' +
				'</td>' +
			'</tr>'
			*/

	_langtag = window.getLangtag ? getLangtag(tld) : false;

	if (domainCache[sld] != undefined && domainCache[sld][tld] != undefined && domainCache[sld][tld][_langtag] != undefined) {
		addRow(sld, tld, domainCache[sld][tld][_langtag]);
	} else {
		if (domain_check_url) {
			_langtag = (_langtag ? '&langTag=' + _langtag : '');
			
			$.getJSON(domain_check_url + "&sld=" + sld + '&tld=' + tld + _langtag + '&callback=?', function(data) {
				if (data.error == 0 && data[sld + '.' + tld] != '') {
					var reverse = data[sld + '.' + tld] == 1 ? 0 : 1;
					data = { 'domain' : reverse, 'status' : true };
					if (domainCache[sld] == undefined)
						domainCache[sld] = {};
					domainCache[sld][tld] = data;
				} else {
					data = { 'status' : false, 'msg' : domain_check_error_msg }
				}
				
				if (domainCache[sld] == undefined) domainCache[sld] = {};
				if (domainCache[sld][tld] == undefined) domainCache[sld][tld] = {};

				domainCache[sld][tld][_langtag] = data;
				
				addRow(sld, tld, data);
				if (callback)
					callback(sld + '.' + tld);
				else if (pre_domains_search) {
					choose_domains();
					updateTotalPrices();
				}
			});
		} else {
			_langtag = (_langtag ? '&langTag=' + _langtag : '');
		
			$.get("ajax.php?action=domain_check&sld=" + sld + '&tld=' + tld + _langtag, function(data) {
				addRow(sld, tld, data);
				if (data['status']) {
					if (domainCache[sld] == undefined) domainCache[sld] = {};
					if (domainCache[sld][tld] == undefined) domainCache[sld][tld] = {};
					domainCache[sld][tld][_langtag] = data;
					
					if (callback)
						callback(sld + '.' + tld);
					else if (pre_domains_search) {
						choose_domains();
						updateTotalPrices();
					}
				}
			}, 'json');
		}
	}
}
function addRow(sld, tld, data) {
	var trId = '#' + sld + '_' + tld.replace(/\./g, '_');
	
	if (!data['status']) {
		$(trId + ' td:eq(1)').html((window.punycode ? punycode.toUnicode(sld + '.' + tld) : sld + '.' + tld) + ' - ' + data['msg']);
		$(trId + ' td.period').removeClass('loading');
		return;
	}

	if (data['domain'] == 0) {
		$(trId + ' td:first input').css('visibility', 'visible');
		$(trId + ' td:eq(1) span').html(register_msg).css('color', 'green');
		$(trId + ' td.period').removeClass('loading');

		domain_options(sld, tld);
	} else if (domainsInfo[tld]['transfer']) {
		$(trId + ' td:first input').css('visibility', 'visible');
		$(trId + ' td:eq(1) span').html(transfer_msg).css('color', 'red');
		$(trId + ' td.period').removeClass('loading');
		$(trId + ' td.sum').addClass('transfer-sum');
		$(trId + ' td:eq(1)').append('<input type="hidden" name="transfer[' + sld + '.' + tld + ']" value="1" class="transfer_domain">');

		if (domainsInfo[tld]['epp']) {
			$(trId + ' p.epp').html('<label>' + epp_msg + ' <input class="regtrans_epp" type="text" name="epp[' + sld + '.' + tld + ']" /></label>');
		}

		domain_options(sld, tld);
	} else {
		$(trId + ' td:eq(1)').html((window.punycode ? punycode.toUnicode(sld + '.' + tld) : sld + '.' + tld) + ' - ' + transfer_not_supported_msg);
		$(trId + ' td.period').removeClass('loading');
	}

	/*
	$('input:checkbox:first', $(trId)).click(function(){
		if ($(this).css('visibility') == 'hidden') return;
		if ($(this).prop('checked'))
			$(trId).addClass('selected');
		else
			$(trId).removeClass('selected');
	});
	*/

	if ((searched == sld + '.' + tld) && ($('#check_domain_' + searched.replace(/\./g, '\\.')).prop('checked') !== true))
		$('#check_domain_' + searched.replace(/\./g, '\\.')).click().change();

	if (domain_search_params.tld == tld) {
		if (domain_search_params.dperiod != '' && parseInt(domain_search_params.dperiod) >= 1 && parseInt(domain_search_params.dperiod) <= 10)
			$(trId + ' select.domain_period').val('period_' + 12 * parseInt(domain_search_params.dperiod));
		if (domain_search_params.epp != '')
			$(trId + ' p.epp input').val(domain_search_params.epp);
		if (domain_search_params.idp == 1 || domain_search_params.idp[tld] == 1) {
			$(trId + ' p.idp input').click();
			$(trId + ' td.sum p').css('visibility', 'visible');
		}
	}
}

function domain_period_text(period_months) {
	var period_years = parseInt(period_months.replace('period_', '')) / 12;
	if (period_years == 1)
		return period_years + ' ' + year_msg;
	return period_years + ' ' + years_msg;
}

function domain_options(sld, tld) {
	var domain = sld + '.' + tld;
	var trId = '#' + sld + '_' + tld.replace(/\./g, '_');
	var tr = $(trId);
	var tldPrice = $(trId + ' span.tld-price');
	var periodSelect = $(trId + ' td.period').html('<select name="period[' + sld + '.' + tld + ']" class="domain_period tip" title="' + domain_period_msg + '"></select>').find('select');
	var firstPrice = false;

	var price_option = tr.find('input.transfer_domain').size() ? 'prices_transfer' : 'prices_register';
	if ('undefined' == typeof registerdomainProducts[tld][price_option])
		price_option = 'prices';

	for (period in registerdomainProducts[tld][price_option]) {
		if (firstPrice === false)
			firstPrice = registerdomainProducts[tld][price_option][period][currency];
		periodSelect.append('<option value="' + period + '">' + domain_period_text(period) + '</option');
	}
	
	tldPrice.data('domain-price-only', firstPrice);
	tldPrice.html(sprintf(currency_symbols[currency] + '%0.2f', firstPrice));

	periodSelect.change(function() {
		update_domain_total_price(tr);
		/*
		var checkbox = $('input:checkbox:first', tr);
		if (!checkbox.prop('checked')) {
			tr.addClass('selected');
			checkbox.prop('checked', true);
		}
		var pval = $(this).val();
		tldPrice.html(sprintf(currency_symbols[currency] + '%0.2f', registerdomainProducts[tld][price_option][pval][currency]));
		
		if (domainsInfo[tld]['id_protect'] !== false) {
			$(trId + ' p.idp span.idp_price').html(' + ' + idp_price_text(pval, currency));
			$(trId + ' td.sum p').html(sprintf(currency_symbols[currency] + '%0.2f', idpProduct.prices[pval][currency]));
		}
		*/		
	});

	if (domainsInfo[tld]['id_protect']) {
		$(trId + ' p.idp').html('<label class="tip" title="' + whois_protect_title_msg + '">' +
			'<input type="checkbox" name="idp[' + sld + '.' + tld + ']" value="1" data-price="' + idp_price(periodSelect.val(), currency) + '" />' +
			whois_protect_msg + '<span class="idp_price"> + ' + idp_price_text(periodSelect.val(), currency) + '</span>' + 
		'</label>');
	
		/*
		if (typeof idpProduct.prices[periodSelect.val()] != 'undefined' && typeof idpProduct.prices[periodSelect.val()][currency] != 'undefined')
			$(trId + ' p.tld-price-id-protect').html(sprintf(currency_symbols[currency] + '%0.2f', idpProduct.prices[periodSelect.val()][currency]));
		*/
	}
	
	if (ssl_certificates) {
		var html = '<label>\
			<input type="checkbox" name="ssl[' + sld + '.' + tld + ']" value="1" />' + ssl_certificate_label + '\</label>\
			<div class="ssl_choise">';

		for (k in ssl_certificates) {
			html = html + '<input type="radio" name="ssl[' + domain + '][type]" value="' + k + '" id="' + k + '_' + sld + '_' + tld + '" data-price="' + get_ssl_price(periodSelect.val(), k, currency) + '"><label for="' + k + '_' + sld + '_' + tld + '">' + window[k + '_msg'] + ' <span class="price" data-type="' + k + '"></span></label> <br />';
		}
		
		if (window.ssl_approver_email_select)
			html = html + '<div class="approver_email"></div>';

		html = html + '</div>';

		$(trId + ' p.ssl').html(html);
		
		$(trId + ' p.ssl input[type="checkbox"][name^="ssl"]').on('change', function() {
			if (window.ssl_approver_email_select && $(this).prop('checked')) {
				ssl_approver_email_select(domain, $(trId + ' p.ssl .approver_email'), true, true, (tr.find('input.transfer_domain').size() ? true : false));
			}
		});

		var sslperiodSelect = '';
		for (period in ssl_certificates['ssl_certificate']['prices']) {
			var period = period.replace(/period\_/g, '');
			sslperiodSelect = sslperiodSelect + '<option value="period_' + period + '">' + domain_period_text(period) + '</option>';
		}
		
		if (sslperiodSelect != '')
			$(trId + ' td.period').append($('<select name="ssl[' + domain + '][period]" class="ssl_period_select tip" title="' + ssl_period_msg + '">' + sslperiodSelect + '</select>'));
	}
}

function choose_domains() {
	var trId, tld, domain, domain_, period, tbl = '';

	$('input.register_transfer:checked').each(function(){
		domain = $(this).val();
		domain_ = domain.replace(/\./g, '_');

		if ($('#selected_' + domain_)[0])
			remove_selected_domain(domain);
	
		trId = '#' + domain_;
		tld = $(trId).attr('tld');
		domain_period = $('select.domain_period', $(trId)).val();
		
		var price_option = 'prices_register';
		action = '<span style="color: green">' + register_msg + '</span>';
		if ($(trId + ' input.transfer_domain')[0]) {
			price_option = 'prices_transfer';
			action = '<span style="color: red">' + transfer_msg + '<input type="hidden" name="transfer[' + domain + ']" value="1" /></span>';
			if (domainsInfo[tld]['epp'])
				action = action + '<input type="hidden" name="epp[' + domain + ']" value="' + $(trId + ' input.regtrans_epp').val() + '" />';
		}
		
		if ('undefined' == typeof registerdomainProducts[tld][price_option])
			price_option = 'prices';

		var idp_div = '';
		var idp_period_div = '';
		var idp_price_div = '';
		
		if ($(trId + ' p.idp input').prop('checked')) {
			idp_div = '<div class="additional_service">' + whois_protect_msg + '\
				<input type="hidden" name="id_protect[' + domain + ']" value="1" />\
				<input type="hidden" name="id_protect_rppid[' + domain + ']" value="' + idpProduct['rp_product_id'] + '" />\
			</div>';
			idp_period_div = '<div>' + domain_period_text(domain_period) + '\
				<input type="hidden" name="idp_periods[' + domain + ']" class="ssl_period" value="' + domain_period + '" />\
			</div>';
			
			idp_price_div = '<div class="tld-price-id-protect" price="' + idpProduct.prices[domain_period][currency] + '">' + $(trId + ' td.sum p').html(idp_price_text(domain_period, currency)) + '</div>';
		}
		
		var ssl_div = '';
		var ssl_price_div = '';
		var ssl_period_div = '';
		if ($(trId + ' p.ssl input[name="ssl[' + domain + ']"]').prop('checked')) {
			var ssl_type = $(trId + ' input[name="ssl[' + domain + '][type]"]:checked').val();
			var ssl_approver_email = $(trId + ' .ssl_approver_email').val();
			if (ssl_approver_email == 'custom') {
				ssl_approver_email = $(trId + ' input.ssl_approver_email').val();
			}

			var ssl_period = $('select.ssl_period_select', $(trId)).val();
			
			ssl_div = '<div class="additional_service">' + window[ssl_type + '_msg'] + '\
				<input type="hidden" name="ssl_data[' + domain + '][hostname]" value="' + domain + '" />\
				<input type="hidden" name="ssl_data[' + domain + '][type]" value="' + ssl_type + '" class="ssl_type"/>\
				<input type="hidden" name="ssl_data[' + domain + '][details][approver_email]" value="' + ssl_approver_email + '">\
				<input type="hidden" name="ssl_data[' + domain + '][details][organization]" value="' + $('input[name="registrantorganizationname"]').val() + '">\
				<input type="hidden" name="ssl_data[' + domain + '][details][organization_unit]" value="' + $('input[name="registrantorganizationunit"]').val() + '">\
				<input type="hidden" name="ssl_data[' + domain + '][rpp_id]" value="' + ssl_certificates[ssl_type]['rp_product_id'] + '">\
			</div>';
			
			ssl_period_div = '<div>' + domain_period_text(ssl_period) + '<input type="hidden" name="ssl_data[' + domain + '][period]" class="ssl_period" value="' + ssl_period + '" /></div>';
			
			ssl_price_div = '<div class="tld-price-ssl-certificate" data-price="' + ssl_certificates[ssl_type]['prices'][ssl_period][currency] + '">' + ssl_price_text(ssl_period, ssl_type, currency) + '</div>';
		}
		
		langtag_div = '';
		if (window.getLangtag) {
			var _langtag = getLangtag(tld);
			if (_langtag != 'undefined' &&  _langtag != '' && _langtag != null)
				langtag_div = '<input type="hidden" name="extra_attributes[' + domain + '][langtag]" value="' + _langtag + '" />';
		}
		
		tbl = tbl + '<tr class="domain_tr" tld="' + $(trId).attr('tld') + '" id="selected_' + domain_ + '">' +
			'<td class="ui-widget-content" style="padding-left:10px">' +
				action + ' <strong>' + (window.punycode ? punycode.toUnicode(domain) : domain) + '</strong>\
				<input type="hidden" name="domains[]" value="' + domain + '" />\
				<input type="hidden" name="domains_rppid[' + domain + ']" value="' + registerdomainProducts[$(trId).attr('tld')]['rp_product_id'] + '" />' + idp_div + ssl_div + langtag_div + 
			'</td>' +
			'<td class="ui-widget-content" align="center">' +
				domain_period_text(domain_period) +
				'<input type="hidden" name="domain_periods[' + domain + ']" class="domain_period" value="' + domain_period + '" />' + 
				idp_period_div + ssl_period_div +
			'</td>' +
			'<td class="ui-widget-content" align="right" style="padding-right:35px;">' +
				'<span class="tld-price" price="' + registerdomainProducts[tld][price_option][domain_period][currency] + '">' +
					$(trId + ' span.tld-price').html() + '</span>' + idp_price_div + ssl_price_div +
			'</td>' +
			'<td class="remove_selected_domain ui-widget-content" align="center">' +
				'<div class="ui-icon ui-icon-trash" title="remove_from_order"></div></td>' +
			(domainProducts[tld] ?
			'<td class="promo_td ui-widget-content" style="visibility:hidden;width:110px;" align="center">' +
				'<label><input type="radio" name="promo" value="' + domain + '" class="choose_promo" /> <span class="promo_text">' +
					promo_msg + '</span></label>' +
			'</td>' : '') +
		'</tr>';
	});

	if (tbl != '') {
		if ($('#selected_domains_table')[0]) {
			$('#selected_domains_table').append(tbl);
		} else {
			$('#selected_domains').html(tbl);
		}

		$('input.choose_promo:first', $('#selected_domains_table')).click();

		$('#change_whois_details_div').css('display', '');
		$('#domain_terms').css('display', '');
		if ($("input[name^='id_protect']", $('#selected_domains_table')).length > 0)
			$('#idp_terms').css('display', '');

	}

	last_tr = $('#selected_domains_table tr:last').html();
	//$.post('ajax.php?action=remember&name=regDomain_' + domain + '&value=' + '<tr class="domain_tr" tld="' + $(trId).attr('tld') + '" id="selected_' + domain_ + '">' + last_tr + '</tr>', function() {});

	if ($('#empty_domains_msg').is(':visible'))
		$('#empty_domains_msg').hide();

	updateDomainPrices();
}

function remove_selected_domain(domain, clear_extra) {
	$('#selected_' + domain.replace(/\./g, '_')).remove();	
	updateTotalPrices();

	if (clear_extra && extra_attributes[domain])
		delete extra_attributes[domain];

	if ($('tr.domain_tr', $('#selected_domains_table')).length == 0) {
		$('#change_whois_details_div').css('display', 'none');
		$('#domain_terms').css('display', 'none');
		$('#idp_terms').css('display', 'none');

		if (!$('#empty_domains_msg').is(':visible'))
			$('#empty_domains_msg').show();
	}
	updateDomainPrices();
}

function registrant_owner_details() {
	if ($('#selected_owner_details').text() == '' && $('#client_firstname').val() == '' && $('#client_lastname').val() == '') {
		//var change = false;
		//if ($('#client_country option:selected').attr('euro') != $('#registrantcountry option:selected').attr('euro') || $('#client_country option:selected').val() != 'US')
		//	change = true;

		$('#client_company_name').val($('#registrantorganizationname').val()).attr('validated', 1).css('border', '1px solid green');
		$('#client_firstname').val($('#registrantfirstname').val()).attr('validated', 1).css('border', '1px solid green');
		$('#client_lastname').val($('#registrantlastname').val()).attr('validated', 1).css('border', '1px solid green');
		$('#client_address1').val($('#registrantaddress1').val()).attr('validated', 1).css('border', '1px solid green');
		$('#client_address2').val($('#registrantaddress2').val()).attr('validated', 1).css('border', '1px solid green');
		$('#client_city').val($('#registrantcity').val()).attr('validated', 1).css('border', '1px solid green');
		$('#client_state').val($('#registrantstateprovince').val()).attr('validated', 1).css('border', '1px solid green');
		$('#client_state_us').val($('#registrantstateprovince_us').val()).attr('validated', 1).css('border', '1px solid green');
		$('#client_zip').val($('#registrantpostalcode').val()).attr('validated', 1).css('border', '1px solid green');
		$('#client_country').val($('#registrantcountry').val()).attr('validated', 1).css('border', '1px solid green');
		$('#client_email').val($('#registrantemailaddress').val()).attr('validated', 1).css('border', '1px solid green');
		$('#client_phone').val($('#registrantphone').val()).attr('validated', 1).css('border', '1px solid green');

		select_owner_details();

		//if (change)
			$('#client_country').change();

		if ($('#client_country option:selected').attr('euro') == 1)
			$('#owner_dialog').dialog('open');
	}
}

function validate_extra() {
	var ret = true;
	$('input:visible,select:visible', $('#extra_holder')).each(function(){
		if ($(this).is(':checkbox')) {
			if (!$(this).prop('checked')) ret = false;
		} else {
			if ($(this).val() == '') ret = false;
		}
	});
	return ret;
}

//$(function(){
	//buttons1[close_msg] = function(){ $(this).dialog('close') };
	buttons1[close_msg] = function(){
		var thiz = $(this);
		
		$('#extra_attributes').empty();
		var extra_domains = $('input.register_transfer_extra:checked');
		if (extra_domains.length > 0) {
			var selected_extra_params = '';
			$.each(extra_domains, function(){
				showMsg('error', $(this).val()  + invalid_domain_extra_attributes);
				$(this).prop('checked', false)
			 });

		//	loadSafe($('#extra_attributes'), '/order/ajax.php?action=extra_attributes&' + extra_domains.serialize() + selected_extra_params);
		}

		do_proceed = function() {
			
			if (!validate_all($('#whois_form'))) {
				//showMsg('error', invalid_whois_details_msg);
				return;
			}

			if (!validate_extra()) {
				showMsg('error', invalid_domain_extra_required_params_msg);
				return;
			}

			thiz.dialog('close');
			$('form.attributes_form', $('#extra_holder')).each(function(){
				extra_attributes[$(this).attr('domain')] = $(this).serialize();	
			});
			without_whois = true;
			choose_domains();
			updateTotalPrices();
			owner_details();
			registrant_owner_details();
			$('#submit_whois').click(); //browser form history patch
		}

		if (validate_count == 0) {
			do_proceed();
			do_proceed = undefined;
		}


		$('#client_firstname').change(function() {
				$('#registrantfirstname').val($(this).val());
				});
		$('#client_lastname').change(function() {
				$('#registrantlastname').val($(this).val());
				});
		$('#client_address1').change(function() {
				$('#registrantaddress1').val($(this).val());
				});
		$('#client_city').change(function() {
				$('#registrantcity').val($(this).val());
				});
		$('#client_state_us').change(function() {
				$('#registrantstateprovince_us').val($(this).val());
				});
		$('#client_state').change(function() {
				$('#registrantstateprovince').val($(this).val());
				});
		$('#client_zip').change(function() {
				$('#registrantpostalcode').val($(this).val());
				});
		$('#client_country').change(function() {
				$('#registrantcountry').val($(this).val());
				});
		$('#client_email').change(function() {
				$('#registrantemailaddress').val($(this).val());
				});
		$('#client_phone').change(function() {
				$('#registrantphone').val($(this).val());
				});
/*		$('#client_country').change(function() {
				$('#registrantcountry').val($(this).val());
				});
*/
		//$(this).dialog('close')
		//get_period_value = $('input[name^="period\["]:visible:checked').val();
		var get_period_value = $('#products-block > .ui-widget-content > div:visible input[name^="period\["]:checked').val();
		get_tax(get_period_value);
	};
	buttons1[whois_msg] = function(){
	
		var thiz = $(this);
	
		do_proceed = function() {
			if (!validate_all($('#domain_search'))) {
				//showMsg('error', invalid_whois_details_msg);
				return;
			}
					
			if ($('input.register_transfer:checked').length == 0) {
				showMsg('error', please_select_domains_msg);
				return;
			}
	
			if (window.validate_langtag && !validate_langtag()) {
				showMsg('error', invalid_domain_langtag);
				return;
			}
	
			// check for epps
			if ($('tr.selected input.regtrans_epp:visible').length) {
				var missing_epp;
				$('tr.selected input.regtrans_epp:visible').each(function() {
					if ($(this).val() == '') {
						missing_epp = $(this);
						return;
					}
				});
				
				if (typeof missing_epp === 'object') {
					showMsg('error', invalid_epp);
					missing_epp.focus();
					return false;
				}
			}
			
			// check for approver_email and set as registrant email
			if ($('#domain_search .ssl_approver_email:visible').length)
				$('#whois input[name="registrantemailaddress"]').val($('#domain_search .ssl_approver_email:visible').val());
	
			if ($('#domain_search p.ssl input[type="checkbox"]:checked').length) {
				$('#whois tr.organization_name .red').html('*');
				$('#whois tr.organization_name input').removeAttr('empty').attr('as', 'company');
				$('#whois tr.organization_unit input').attr('as', 'company_unit').parent().parent().show();
			} else {
				$('#whois tr.organization_name .red').html('');
				$('#whois tr.organization_name input').attr('empty', '1');
				$('#whois tr.organization_unit input').removeAttr('as').parent().parent().hide();
			}
			
			$('#domain_search').css('display', 'none');
			$('#domain_owner_details').css('display', '');
	
			thiz.dialog('option', 'buttons', buttons2);
	
			$('#extra_attributes').empty();
			var extra_domains = $('input.register_transfer_extra:checked');
			if (extra_domains.length > 0) {
				var selected_extra_params = '';
				extra_domains.each(function(){
					if (extra_attributes[$(this).val()])
						selected_extra_params = selected_extra_params + '&' + extra_attributes[$(this).val()];
				});
	
				loadSafe($('#extra_attributes'), 'ajax.php?action=extra_attributes&' + extra_domains.serialize() + selected_extra_params);
			}
		}

		if (validate_count == 0) {
			do_proceed();
			do_proceed = undefined;
		}		
	};
	buttons2[back_msg] = function(){
		back_action();
	};
	buttons2[proceed_msg] = function(){
		var thiz = $(this);
		
		do_proceed = function() {
			if (!validate_all($('#whois_form'))) {
				//showMsg('error', invalid_whois_details_msg);
				return;
			}

			if (!validate_extra()) {
				showMsg('error', invalid_domain_extra_required_params_msg);
				return;
			}
			
			thiz.dialog('close');
			$('form.attributes_form', $('#extra_holder')).each(function(){
				extra_attributes[$(this).attr('domain')] = $(this).serialize();	
			});

			choose_domains();
			updateTotalPrices();
			registrant_owner_details();
			$('#submit_whois').click(); //browser form history patch
		}

		if (validate_count == 0) {
			do_proceed();
			do_proceed = undefined;
		}

		//get_period_value = $('input[name^="period\["]:visible:checked').val();
		var get_period_value = $('#products-block > .ui-widget-content > div:visible input[name^="period\["]:checked').val();
		get_tax(get_period_value);
	};

	$('#domain_dialog').dialog('option', 'buttons', buttons1);

	$('#sld').focus().change(function() { domainCache = {}; });

	$(document).on('click','#domain_dialog p.idp input:checkbox', function() {
		if ($(this).is(':checked'))
			$('td.sum p', $(this).closest('tr')).css('visibility', 'visible');
		else
			$('td.sum p', $(this).closest('tr')).css('visibility', 'hidden');
	});

	$(document).on('change', 'input.register_transfer', function(){
		if ($(this).css('visibility') == 'hidden')
			return;
		if ($(this).is(':checked'))
			$(this).closest('tr').addClass('selected');
		else
			$(this).closest('tr').removeClass('selected');
	});

	$('#domain_search_form').submit(function(){
		//searched = $.trim($('#sld').val()).toLowerCase().replace(/^www\./, '');
		$('#sld').val((window.punycode ? punycode.toUnicode(domain_search_get_sld($('#sld').val(), true)) : domain_search_get_sld($('#sld').val(), true)));
		
		searched = domain_search_get_sld();

		if (searched.length < 3)
			return false;
	
		if (searched.length > 63) {
			showMsg('error', invalid_domain);
			return false;	
		}
		
		/*
		
		if (searched.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]+[a-zA-Z0-9]$/)) {
			searched = domain_search_get_sld(searched).replace(/[^a-z0-9-]/g, "");
		} else if (window.punycode) {
			searched = domain_search_get_sld(searched);
		} else {
			return false;
		}
		*/

		if (window.langtag_required_func) {
			langtag_required_func(searched);
			if (typeof langtag_required != 'undefined' && langtag_required) {
				if ((typeof langtag == 'undefined') || (!langtag)) {
					showMsg('notice', langtag_not_selected);
					return false;
				} 
			}		
		}
		
	
		var matches = searched.match(/([a-z0-9-]+)(?:\.([a-z0-9-.]+))?$/);
		
		if (!matches) {
			showMsg('error', invalid_domain_msg);
			return false;
		};

		$('#tlds-results-table').empty();
		//$('#sld').val(punycode.toUnicode(matches[0]));
		
		$('input.extensions[value="' + matches[2] + '"]', $(this)).prop('checked', true);

		if (matches[2]) domainCheck(matches[1], matches[2]);
		$("input.extensions:checked", $(this)).each(function(){
			if (!matches[2] || matches[2] != $(this).val()) domainCheck(matches[1], $(this).val());
		});
		
		if ($('#domain-suggest-table').length) {
			$('#domain-suggest-table').empty();
			$('span.found_suggestions').empty();
			get_suggestion((window.punycode ? punycode.toUnicode(matches[0]) : matches[0]), $('input.extensions:checked').map(function() { return this.value; }).get().join('|'))
		}
		
		return false;
	});

    $('#check_multiple').click(function() {
        var domains = $('#search_textarea').val().split(/[\r\n\,;]+/);
        $('#tlds-results-table').empty();

        for (i in domains) {
            var matches = $.trim((window.punycode ? punycode.toASCII(domains[i]) : domains[i])).toLowerCase().replace(/^www\./, '').match(/([a-z0-9-.]+)/);

            if (matches) {
                if (matches[0].indexOf('.') != -1)
                    $('input.extensions[value="' + matches[0].substring((matches[0].indexOf('.') + 1)) + '"]').prop('checked', true);

				var tlds = $('input.extensions:checked').map(function() { return this.value; }).get().join('|');

                if (domains[i].indexOf('.') != -1) {
                    domainCheck(matches[0].substring(0,matches[0].indexOf('.')), (matches[0].substring((matches[0].indexOf('.') + 1))));
					if ($('#domain-suggest-table').length) {
						if (i == 0) $('#domain-suggest-table').empty();
						$('span.found_suggestions').empty();

						var _match = matches[0].substring(0,matches[0].indexOf('.'));
						get_suggestion((window.punycode ? punycode.toUnicode(_match) : _match), tlds);
					}
                } else {
                    $("input.extensions:checked").each(function(){
                        domainCheck(matches[0], $(this).val());
                    });
					if ($('#domain-suggest-table').length) {
						if (i == 0) $('#domain-suggest-table').empty();

						$('span.found_suggestions').empty();
						get_suggestion((window.punycode ? punycode.toUnicode(matches[0]) : matches[0]), tlds);
					}
                }
            }
        }

        return false;
    });
	
	function get_suggestion(key, tlds) {
		if (!$('#domain-suggest-table').length)
			return false;
			
		$.post('ajax.php?action=get_suggestion', {key: key, tlds: tlds, language: langtag_obj.find('option:selected').data('alternative')}, function(d) {
			if (d.suggestions) {
				$.each(d.suggestions, function(k, v) {
					// append suggestion
					var parts = v.name.split('.');
					var sld = parts[0].toLowerCase();
					parts.shift();						
					var tld = parts.join('.').toLowerCase();
					
					if ($('#domain-suggest-table tr').length % 2) var evenClass = '';
						else var evenClass = ' even';

					sld = punycode.toASCII(sld);

					if (!$("#" + sld + '_' + tld.replace(/\./g, '_'))[0]) {
						$('#domain-suggest-table').append(dom_tr_template(sld, tld, evenClass));
						addRow(sld, tld, v);
					}	
				});
				// set num of results
				$('span.found_suggestions').html('&nbsp;' + $('#domain-suggest-table tr').length + '&nbsp;');
			} else if (d.msg) {
				$('#domain-suggest-table').append('<h4 style="text-align:center">' + d.msg + '</h4>');
			}
			return false;
		}, 'json');		
	}

	$('#domain_search_form .show_hide_textarea').click(function() {
		$('#search_input').toggle();
		$('#search_textarea_div').toggle();
		return false;
	});

	$("input[name='extension_type']").click(function(){
		var clicked = tld_list[$(this).val()];
		if (typeof clicked == 'number') {
			$("input.extensions").prop('checked', clicked ? true : false);
		} else {
			$("input.extensions").each(function(){
				if (clicked[$(this).val()] == 1)
					$(this).prop('checked', true);
				else
					$(this).prop('checked', false);
			});
		}
	});
	$('#most_popular').click();
	
	$(document).on('click', 'td.remove_selected_domain', function(){
		var dom = $(this).parent().attr('id').replace('selected_', '').replace(/_/g, '.');
		remove_selected_domain(dom, true);
		$.post('ajax.php?action=delete_domain&domain=' + dom, function() {});
		//get_period_value = $('input[name^="period\["]:visible:checked').val();
		var get_period_value = $('#products-block > .ui-widget-content > div:visible input[name^="period\["]:checked').val();
		get_tax(get_period_value);
	});
	
	$(document).on('click', 'input.choose_promo', function(){
		choose_promo($(this).val());
		$('span.promo_text', $('#selected_domains_table')).css('font-weight', 'normal');
		$(this).next().css('font-weight', 'bold');
	});

	$('#change_whois_details').click(function(){
		$('#domain_search').css('display', 'none');
		$('#domain_owner_details').css('display', '');
		$('#domain_dialog').dialog('option', 'buttons', buttons2);

		$('#extra_attributes').empty();

		var extra_params = '';
		for (var dom in extra_attributes)
			extra_params += '&domains[]=' + dom + '&' + extra_attributes[dom];

		if (extra_params != '')
			loadSafe($('#extra_attributes'), 'ajax.php?action=extra_attributes' + extra_params);

		$('#domain_dialog').dialog('open');
	});
//});

function dom_tr_template(sld, tld, evenClass) {
	return '<tr id="' + sld + '_' + tld.replace(/\./g, '_') + '" class="domain_tr' + evenClass + '" tld="' + tld + '">\
		<td class="radioTd">\
			<input type="checkbox" name="domains[]" class="register_transfer' +	(domainsInfo[tld]['extra_attributes'] ? ' register_transfer_extra' : '') + '" value="' + sld + '.' + tld + '" style="visibility: hidden" id="check_domain_' + sld + '.' + tld + '" />\
		</td>' + 
		/*
		<td class="radioTd">\
			<input type="checkbox" name="domains[]" class="register_transfer"' + 
			'value="' + sld + '.' + tld + '" style="visibility: hidden" id="check_domain_' + sld + '.' + tld + '" />\
		</td>\
		*/
		'<td>\
			<label for="check_domain_' + sld + '.' + tld + '"><span>' + checking_msg + '</span>\
			<strong>' + (window.punycode ? punycode.toUnicode(sld + '.' + tld) : sld + '.' + tld) + '</strong></label>\
			<p class="epp"></p>\
			<div class="additional_services">\
				<p class="idp"></p>\
				<p class="ssl"></p>\
			</div>\
		</td>\
		<td class="period loading"></td>\
		<td class="sum">\
			<span class="tld-price"></span>\
			' + 
			//'<p class="tld-price-id-protect"></p>' + 
		'</td>\
	</tr>';
} 

function idp_price(period, currency) {
	if (
		typeof idpProduct != 'object' ||
		typeof idpProduct['prices'] != 'object' ||
		typeof idpProduct['prices'][period] != 'object' ||
		typeof idpProduct['prices'][period][currency] == 'undefined'
	)
		return;
	
	return idpProduct['prices'][period][currency];
}

function idp_price_text(period, currency) {
	if (price = idp_price(period, currency))
		return sprintf(currency_symbols[currency] + '%0.2f', price);
	else 
		return '';
}

function update_domain_total_price(tr) {
	var tld = tr.attr('tld');
	var currency = getCurrency().val();

	var domain_period = tr.find('.period select.domain_period').val();
	var price_option = tr.find('input.transfer_domain').size() ? 'prices_transfer' : 'prices_register';
	
	if ('undefined' == typeof registerdomainProducts[tld][price_option])
		price_option = 'prices';	
	
	var total_domain_price = parseFloat(registerdomainProducts[tld][price_option][domain_period][currency]);

	if (domainsInfo[tld]['id_protect'] !== false) {
		var idp_tr = tr.find('.additional_services .idp input');
		if (idp_tr.length) {
		
			if (idp_tr.prop('checked')) {
				var idp_price = parseFloat(idpProduct['prices'][domain_period][currency]);
				total_domain_price = total_domain_price + idp_price;
			}
		}
	}
	
	var ssl_tr = tr.find('.additional_services .ssl input[type="checkbox"]');
	if (ssl_tr.length) {
		if (ssl_tr.prop('checked')) {
			var ssl_type = tr.find('.ssl_choise input[type="radio"]:checked').attr('value');
			var ssl_period = tr.find('select.ssl_period_select').val();
			var ssl_price = parseFloat(ssl_certificates[ssl_type]['prices'][ssl_period][currency]);
			
			total_domain_price = total_domain_price + parseFloat(ssl_price);
		}
	}

	tr.find('.tld-price').html(sprintf(currency_symbols[currency] + '%0.2f', total_domain_price));
}