$(function() {
	jQuery.fn.extend({
	    donetyping: function(callback,timeout){
	        timeout = timeout || 1e3; // 1 second default timeout
	        var timeoutReference,
	            doneTyping = function(el){
	                if (!timeoutReference) return;
	                timeoutReference = null;
	                callback.call(el);
	            };
	        return this.each(function(i,el){
	            var $el = $(el);
	            // Chrome Fix (Use keyup over keypress to detect backspace)
	            // thank you @palerdot
	            var before_value = $el.val();
	            $el.is(':input') && $el.on('keyup',function(e) {
	                // This catches the backspace button in chrome, but also prevents
	                // the event from triggering too premptively. Without this line,
	                // using tab/shift+tab will make the focused element fire the callback.
	                if (e.type=='keyup' && e.keyCode != 8 && $el.val() == before_value) return;
	                
	                // Check if timeout has been set. If it has, "reset" the clock and
	                // start over again.
	                if (timeoutReference) clearTimeout(timeoutReference);
	                timeoutReference = setTimeout(function(){
	                    // if we made it here, our timeout has elapsed. Fire the
	                    // callback
	                    doneTyping(el);
	                }, timeout);
	            }).on('blur', function(){
	                // If we can, fire the event since we're leaving the field
	                doneTyping(el);
	            });
	        });
	    }
	});

	if (location.hash && location.hash == '#SSL' || domain_search_params.ssl != '')
		$('#SSL input[name="ssl_data[rpp_id]"], #SSL input[type="hidden"].ssl_type').prop('disabled', false);

	$('.tabs-new a').on('click', function() {
		if ($(this).attr('id') != 'A_SSL') {
			$('#SSL input[name="ssl_data[rpp_id]"], #SSL input[type="hidden"].ssl_type').prop('disabled', true);
			if (!$('#domains-block').is(':visible'))
				$('#domains-block').show();
		} else {
			$('#SSL input[name="ssl_data[rpp_id]"], #SSL input[type="hidden"].ssl_type').prop('disabled', false);
			$('#domains-block').hide();
		}
	});

	$('body').on('submit', '#order_ssl_dialog form', function(e) {
		e.preventDefault();
		
		if (!validate_all($('#order_ssl_dialog')))
			return false;

		ssl_purchase_from_dialog($('#order_ssl_dialog'));
	}).on('click', '.additional_ssl .remove', function() {
		$(this).parent().remove();
		updateTotalPrices();
	});
	
	function ssl_purchase_from_dialog(elem) {
		var ssl_type = elem.find('input[name="type"]:checked').val();
		if (!ssl_certificates[ssl_type]) {
			showMsg('error', invalid_ssl_type);
			return false;
		}
			
		var ssl_period = elem.find('select[name="period"]').val();
		if (!ssl_certificates[ssl_type]['prices'][ssl_period]) {
			showMsg('error', invalid_ssl_period);
			return false;
		}
		
		var ssl_domain = elem.find('input[name="hostname"]').val();
		var ssl_approver_email = elem.find('.approver_email .ssl_approver_email:visible').val();
		var organization = elem.find('input[name="organization"]').val();
		var organization_unit = elem.find('input[name="organization_unit"]').val();
		
		/*
		var ssl_order_dialog_type = elem.data('type');
		
		if (!$('#' + ssl_order_dialog_type).length) {
			showMsg('error', 'invalid_ssl_data_type');
			return false;
		}
		*/
		
		var period = ssl_period.replace('period_', '')/12;
		
		var tpl = $('<div class="additional_ssl ui-widget-content ui-corner-all" data-ssl="' + ssl_domain + '">\
			<div class="ssl_info">' + tr('ssl_certificate_for', {'ssl_type': window[ssl_type + '_msg'], 'domain': ssl_domain}) + '</div>\
			<div class="ssl_period">' + period + ' ' + (period > 1 ? years_msg : year_msg) + '</div>\
			<div class="ssl_price" data-price="' + ssl_certificates[ssl_type]['prices'][ssl_period][currency] + '">' + sprintf(currency_symbols[currency] + '%0.2f ' + currency, ssl_certificates[ssl_type]['prices'][ssl_period][currency]) + '</div>\
			<div class="remove" title="' + remove_from_order_msg + '"><span class="ui-icon ui-icon-trash"></span></div>\
			<input type="hidden" name="ssl_data[' + ssl_domain + '][type]" value="' + ssl_type + '">\
			<input type="hidden" name="ssl_data[' + ssl_domain + '][period]" value="' + ssl_period + '">\
			<input type="hidden" name="ssl_data[' + ssl_domain + '][hostname]" value="' + ssl_domain + '">\
			<input type="hidden" name="ssl_data[' + ssl_domain + '][details][approver_email]" value="' + ssl_approver_email + '">\
			<input type="hidden" name="ssl_data[' + ssl_domain + '][details][organization]" value="' + organization + '">\
			<input type="hidden" name="ssl_data[' + ssl_domain + '][details][organization_unit]" value="' + organization_unit + '">\
			<input type="hidden" name="ssl_data[' + ssl_domain + '][rpp_id]" value="' + $('body').find('input[name="rpp_id[' + ssl_type + ']"]').attr('value') + '">\
		</div>');
		
		//if ($('#' + ssl_order_dialog_type).find('div[data-ssl="' + ssl_domain + '"]').length)
		//	$('#' + ssl_order_dialog_type).find('div[data-ssl="' + ssl_domain + '"]').remove();		
		//$('#' + ssl_order_dialog_type).append(tpl);

		if ($('#Host_Domain').find('div[data-ssl="' + ssl_domain + '"]').length)
			$('#Host_Domain').find('div[data-ssl="' + ssl_domain + '"]').remove();		
		$('#Host_Domain').append(tpl);
		
		elem.dialog('close');
		
		// update total price
		updateTotalPrices();
	}
	
	$('.ssl_choice select[name="ssl_data[type]"]').on('change', function(e) {
		e.preventDefault();

		var price_period_element = $('#SSL select[name="ssl_data[period]"]');
		var price_period_element_select_val = price_period_element.val();
		$('#SSL input[name="ssl_data[rpp_id]"]').val($('body').find('input[name="rpp_id[' + $(this).val() + ']"]').val());

		$('#SSL .ssl_prices').hide();
		price_period_element.parent().parent().find('#' + $(this).val() + '_prices .ssl_prices[data-rel="' + price_period_element_select_val + '"]').show();
	});
	
	$('#SSL').on('change', 'select[name="ssl_data[period]"]', function(e) {
		var thiz = $(this);
		$('#SSL .ssl_prices').hide();

		var ssl_type = $('#SSL select[name="ssl_data[type]"]').val();
		var ssl_price_element = $('#SSL #' + ssl_type + '_prices').find('.ssl_prices[data-rel="' + $(this).val() + '"]');

		ssl_price_element.show();
		ssl_price_element.find('input[value="' + currency + '"]').click();
	});

	$('#SSL .ssl_choice select').trigger('change');
	
	$('#SSL input[name="organization"], #order_ssl_dialog input[name="organization"], #SSL input[name="ssl_data[details][organization]"]').on('keyup', function() {
		var thiz = $(this);
		var validation_interval = setInterval(function() {
			if (thiz.attr('validated') == '1') {
				clearInterval(validation_interval);
				$('#client_company_name').val(thiz.val());
			}
		}, 1000);
	});
	
	$('input[name="hosted_domain"], input[name="vps[hostname]"], input[name="solusvm[hostname]"], input[name="dedicated[hostname]"]').donetyping(function() {

		var add_to_ssl_elem = false;
		var add_to_ssl_elem_func = false;
		
		switch($(this).prop('name')) {
			case "dedicated[hostname]":
				add_to_ssl_elem = $('#Dedicated .input-details:eq(1)').find('.add_ssl_to_hosted_domain');
				add_to_ssl_elem_func = function() {
					$('#Dedicated .input-details:eq(1)').append('<div class="add_ssl_to_hosted_domain" data-domain="' + domain + '" data-type="Dedicated"><label><span>' + add_ssl_for_hostname_label + ' ' + domain + '</span><span class="ui-icon ui-icon-circle-plus"></span></label><span class="ssl_price"></span></div>');
				}
			break;
			case "solusvm[hostname]":
				add_to_ssl_elem = $('#SOLUSVM .input-details:eq(1)').find('.add_ssl_to_hosted_domain');
				add_to_ssl_elem_func = function() {
					$('#SOLUSVM .input-details:eq(1)').append('<div class="add_ssl_to_hosted_domain" data-domain="' + domain + '" data-type="SOLUSVM"><label><span>' + add_ssl_for_hostname_label + ' ' + domain + '</span><span class="ui-icon ui-icon-circle-plus"></span></label><span class="ssl_price"></span></div>');
				}
			break;
			case "vps[hostname]":
				add_to_ssl_elem = $('#VPS .input-details:eq(1)').find('.add_ssl_to_hosted_domain');
				add_to_ssl_elem_func = function() {
					$('#VPS .input-details:eq(1)').append('<div class="add_ssl_to_hosted_domain" data-domain="' + domain + '" data-type="VPS"><label><span>' + add_ssl_for_hostname_label + ' ' + domain + '</span><span class="ui-icon ui-icon-circle-plus"></span></label><span class="ssl_price"></span></div>');
				}
			break;
			case "hosted_domain":
				add_to_ssl_elem = $(this).parent().find('.add_ssl_to_hosted_domain');
				add_to_ssl_elem_func = function() {
					thiz.after('<div class="add_ssl_to_hosted_domain" data-domain="' + domain + '" data-type="Plans"><span class="ui-icon ui-icon-circle-plus"></span><span>' + add_ssl_for_hostname_label + ' ' + domain + '</span></div>');
				}
			break;
		}

		if (($(this).val() != '') && ($(this).val().length >= 3)) {
			var domain = $(this).val();
			var thiz = $(this);
			
			if (!add_to_ssl_elem || typeof add_to_ssl_elem_func != 'function')
				return false;
				
			element_validated = false;
			
			do_proceed = function() {
				if (add_to_ssl_elem.length) {
					if (add_to_ssl_elem.data('domain') != domain) {
						add_to_ssl_elem.remove();
						add_to_ssl_elem_func();
					} else {
						add_to_ssl_elem.fadeIn();
					}
				} else {
					add_to_ssl_elem_func();
				}
			}
			
			validate_input(thiz);
		} else {
			add_to_ssl_elem.fadeOut();
		}
	});
	
	$('body').on('click', '.add_ssl_to_hosted_domain', function() {
		var domain = $(this).closest('div.add_ssl_to_hosted_domain').data('domain');

		if (!domain) {
			showMsg('error', invalid_domain_msg);
			return false;
		}

		// reset fields		
		//$('#order_ssl_dialog input[type="text"]').val('');
		
		$('#order_ssl_dialog').data('type', $(this).closest('div.add_ssl_to_hosted_domain').data('type'));
		$('#order_ssl_dialog').find('input[name="type"]:first').prop('checked', true).trigger('click');

		// set hostname
		$('#order_ssl_dialog').find('input[name="hostname"]').val(domain);
		// set approver_email
		ssl_approver_email_select(domain, $('#order_ssl_dialog .approver_email'), false, false, true);
		/*
		$('#order_ssl_dialog .approver_email').html(ssl_approver_email_select(domain));
		set_registrant_email(domain, $('#order_ssl_dialog .approver_email select'));
		$('#order_ssl_dialog .approver_email').find('.custom_approver_email, label, select.ssl_approver_email option[value="custom"]').remove();
		*/
		
		$('#order_ssl_dialog').dialog().dialog('open');
		
		$('#order_ssl_dialog .ssl_period_select select').trigger('change');
		
	}).on('click', 'p.ssl input[type="checkbox"]', function() {
		var tr = $(this).closest('tr');

		if ($(this).prop('checked')) {
			var ssl_choise_elem = $(this).closest('tr').find('.ssl_choise');
			ssl_choise_elem.find('input[type="radio"]:first').prop('checked', true).trigger('change');
			var period =  $(this).closest('tr').find('td.period select').val();

			$.each(ssl_choise_elem.find('span.price'), function() {
				$(this).html(' + ' + ssl_price_text(period, $(this).data('type'), currency));
			});
			
			// disable custom ssl_approver email address if IDP is enabled
			if ($(this).closest('tr').find('p.idp input:checked').length) {
				ssl_choise_elem.find('select.ssl_approver_email option[value="custom"]').prop('disabled', true);
				ssl_choise_elem.find('input.ssl_approver_email').prop('disabled', true).hide();
				ssl_choise_elem.find('select.ssl_approver_email').prop('disabled', false).show();
			} else {
				ssl_choise_elem.find('select.ssl_approver_email option[value="custom"]').prop('disabled', false);
				ssl_choise_elem.find('input.ssl_approver_email').prop('disabled', false);
			}
			
			// check if domain has to be transfered and get whois email
			
			ssl_choise_elem.show();
			tr.find('.period select.ssl_period_select').prop('disabled', false).show();
		} else {
			tr.find('.period select.ssl_period_select').prop('disabled', true).hide();
			$(this).parent().parent().find('.ssl_choise').hide();
		}
	}).on('change', '.domains-result-table td.period select.ssl_period_select', function() {
		var thiz = $(this);
		var tr = thiz.parent().parent();
		$.each(ssl_certificates, function(type, data) {
			var _ssl_price_text = ssl_price_text(thiz.val(), type, currency);
			tr.find('p.ssl .ssl_choise span.price[data-type="' + type + '"]').html(_ssl_price_text != '' ? ' + ' + _ssl_price_text : '');
		});
		
		update_domain_total_price(tr);
	}).on('change', '.approver_email select.ssl_approver_email', function() {
		if ($(this).val() == 'custom') {
			$(this).hide();
			var parent = $(this).parent().find('.custom_approver_email');
			parent.show();
			parent.find('input').prop('disabled', false).show().focus();
			$(this).prop('disabled', true);
		} else {
			if ($.inArray(panel.attr('id'), ['Domain_Names', 'SSL']) < 0)
				$('#client_email').val($(this).val());
		}
	}).on('click', '.approver_email .custom_approver_email .close', function() {
		$(this).parent().hide();
		$(this).parent().find('input.ssl_approver_email').prop('disabled', true);
		$(this).parent().parent().find('select.ssl_approver_email').prop('disabled', false).show();
		$(this).parent().parent().find('select.ssl_approver_email option:first-of-type').prop('selected', true);
	}).on('click', 'p.idp input[type="checkbox"]', function() {

		var ssl_choise_elem = $(this).closest('tr').find('.ssl_choise');
		var ssl_approver_email_select_elem = ssl_choise_elem.find('select.ssl_approver_email');
		var ssl_approver_email_input_elem = ssl_choise_elem.find('input.ssl_approver_email');
		
		var domain = $(this).closest('tr').attr('id').replace(/\_/g, '.');
		var current_approver_email_value = ssl_choise_elem.find('.ssl_approver_email:visible').val();
		
		if ($(this).prop('checked')) {
			ssl_approver_email_select_elem.find('option[value="custom"]').prop('disabled', true);
			ssl_approver_email_input_elem.prop('disabled', true).parent().hide();
			
			if (ssl_approver_email_select_elem.find('option:selected').val() == 'custom') {
				if (ssl_approver_email_select_elem.find('option.registrant_email').length)
					var new_approver_email_value = ssl_approver_email_select_elem.find('option.registrant_email').val();
				else
					var new_approver_email_value = ssl_approver_email_select_elem.find('option:first').val();
				
				ssl_approver_email_select_elem.val(new_approver_email_value).prop('disabled', false);
			}
			
			if ($(this).closest('tr').find('p.ssl input:checked').length) {
				ssl_approver_email_select_elem.show();
				if (
					(current_approver_email_value != new_approver_email_value) && 
					((new_approver_email_value != undefined) && (new_approver_email_value != ''))
				)
					showMsg('notice', ssl_and_idp_selected_notice, {domain: domain, current_email: current_approver_email_value, new_email: new_approver_email_value});
			}
		} else {
			ssl_approver_email_select_elem.find('option[value="custom"]').prop('disabled', false);
		}
	}).on('click', 'input.register_transfer', function() {
		if ($(this).prop('checked')) {
			var tr = $('#' + $(this).val().replace(/\./g, '_'));
			if (tr.find('input.transfer_domain').length && tr.find('.approver_email select option[value="custom"]').length) {

				// get registrant email and append to .approver_email select
				$.post('ajax.php?action=get_whois', {domain: $(this).val(), params: ['registrant_email']}, function(d) {
					if (typeof d.registrant_email != 'undefined') {
						tr.find('.approver_email select option:last').after('<option class="registrant_email" value="' + d.registrant_email + '">' + d.registrant_email + '</option>');
						tr.find('.approver_email select').val(d.registrant_email);
					}
				}, 'json');
			}
		}
	}).on('blur', '#whois input[name="registrantorganizationname"]', function() {
		if ($('.ssl input[type="checkbox"]:checked').length) {
			$('#client_company_name').val($(this).val());
		}
	}).on('blur', '#SSL .ssl_details input[name="ssl_data[hostname]"]', function() {
		var thiz = $(this);
		var domain = thiz.val();
	
		do_proceed = function() {
			var approver_email_element = $('#SSL .ssl_details .approver_email');
	
			ssl_approver_email_select(domain, approver_email_element, true, false, true);

			/*approver_email_element.html(ssl_approver_email_select(domain));
			$('#SSL .ssl_details .approver_email').find('.custom_approver_email, label, select.ssl_approver_email option[value="custom"]').remove();
			set_registrant_email(domain, approver_email_element.find('select'));
			*/
			
			//$('#client_email').val(approver_email_element.find('select').val());

			var value_set = approver_email_element.data('value');
			if ((value_set != '') && approver_email_element.find('select option[value="' + value_set + '"]').length) {
				approver_email_element.find('select').val(value_set);
				//$('#client_email').val(value_set);
			}

			approver_email_element.parent().show();
		}

		validate_input(thiz);
	}).on('change', '#SSL .ssl_details .approver_email select', function() {
		//$('#client_email').val($(this).val());
	}).on('change', '#order_ssl_dialog .ssl_period_select select', function() {
		var thiz = $(this);
		$.each($('#order_ssl_dialog input[name="type"]'), function() {
			var price = ssl_price_text(thiz.val(), $(this).attr('value'), currency);
			$(this).parent().find('.' + $(this).attr('value') + '_price').html(price);
		});
	}).on('change', '#domain_search .additional_services input', function() {
		update_domain_total_price($(this).closest('tr'));
	});	
});

function get_ssl_price(period, type, currency) {
	if (
		typeof ssl_certificates != 'object' ||
		typeof ssl_certificates[type] != 'object' ||
		typeof ssl_certificates[type]['prices'] != 'object' ||
		typeof ssl_certificates[type]['prices'][period] != 'object' ||
		typeof ssl_certificates[type]['prices'][period][currency] == 'undefined'
	)
		return '';
		
	return ssl_certificates[type]['prices'][period][currency];
}

function ssl_price_text(period, type, currency) {
	return sprintf(currency_symbols[currency] + '%0.2f', get_ssl_price(period, type, currency));
}

function ssl_approver_email_select(domain, element, set_registrant, add_custom, get_whois) {
	if (typeof get_whois == 'undefined')
		get_whois = false;

	element.html('<span class="loading"></span> <span class="red">' + please_wait_lang + '</span>');

	var domain = (window.punycode ? punycode.toASCII(domain) : domain);
	
	var ssl_field_name = 'approver_email';
	
	if ($('#SSL:visible').length) {
		ssl_field_name = 'ssl_data[details][approver_email]';
	}
	
	$.get("ajax.php?action=approver_emails&get_whois=" + (get_whois == true ? 'true' : 'false') + "&domain=" + domain + (set_registrant === true ? '&set_registrant' : ''), function(d) {

		element.html('<select name="' + ssl_field_name + '" class="ssl_approver_email wide input ui-corner-all"></select>');

		if (
			$('#domain_dialog:visible').length
		) {
			if (!element.parent().find('label[for="' + ssl_field_name + '"]').length)
				element.before('<label for="' + ssl_field_name + '">' + ssl_approver_email + '</label>');
		}

		if (typeof d.whois != 'undefined' && Object.keys(d.whois).length) {
			$.each(d.whois, function(k, v) {
				element.find('select').append($("<option></option>").data('type', k).attr("value", v).text(v));
			});
		}

		if (typeof d.general != 'undefined' && Object.keys(d.general).length) {
			$.each(d.general, function(k, v) {
				element.find('select').append($("<option></option>").attr("value", v).text(v));
			});
		}

		if (add_custom === true) {
			element.find('select').append($("<option></option>").attr("value", 'custom').text(ssl_custom_approver_email));
			element.find('select').after('<div class="custom_approver_email"><input type="email" name="' + ssl_field_name + '" disabled class="ssl_approver_email validate" as="email" placeholder="' + ssl_custom_approver_email_msg + '"><span class="close"></span></div>');
		}

		if (set_registrant !== false)
			var registrant_email = element.find('select').find('option[data-type="registrant_email"]').attr('value');
			if (typeof registrant_email != 'undefined' && registrant_email != '')
				element.find('select').val(registrant_email);
		
		//element.html(html);
	}, 'json');

	return;
}

function valid_domain_name(domain) {
	return $.post('ajax.php?action=domain_registered', {domain: domain}, function(d) {
		return d.status;
	}, 'json');
}

function set_registrant_email(domain, elem) {
	// get registrant email and append to provided elem
	$.post('ajax.php?action=get_whois', {domain: (window.punycode ? punycode.toASCII(domain) : domain), params: ['registrant_email']}, function(d) {
		if (typeof d.registrant_email !== 'undefined') {
			elem.append('<option value="' + d.registrant_email + '" class="registrant_email">' + (window.punycode ? punycode.toUnicode(d.registrant_email) : d.registrant_email) + '</option>');
			elem.val(d.registrant_email);
			elem.trigger('change');
		}
	}, 'json');
}

function tr(str, params) {
	str = (typeof window[str] != 'undefined') ? window[str] : '_' + str + '_';
	
	if (typeof params == 'object') {
		for (i in params) {
			str = str.replace('%' + i + '%', params[i]);
		}
	}
	return str;
}
