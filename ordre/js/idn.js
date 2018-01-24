$(function() {
	langtag = false;
	sld = $.trim($('#sld').val()).toLowerCase().replace(/^www\./, '');
	
	langtag_obj = $('select[name="domain-langtag"]');
	
	$('body').on('keypress', '#sld', function() {
		if ($(this).val() != sld) {
			langtag_required_func();
			sld = $(this).val();
		}
	}).on('change', 'select[name="domain-langtag"]', function() {
		langtag = $(this).val();
		var lang = $(this).find('option:selected').text();

		if (langtag == '') {
			$('#extensions').hide();
			return;
		} else {
			$('#extensions').show();
		}
		
		if ((typeof idn_map[lang] != 'undefined' ) && (idn_map[lang]['tlds'].length)) {
			var already_selected = $('#tld-checkboxes input:checked:visible');

			$('#tld-checkboxes input').prop('disabled', true).prop('checked', false);
			$('#tld-checkboxes input').parent().hide();
			
			$('#first_tld option').prop('disabled', true).prop('checked', false)

			var extension_type = $('input[name="extension_type"]:checked').val();
			
			$.each(idn_map[lang]['tlds'], function(k, tld) {
				$('#tld-checkboxes input[value="' + tld + '"]').prop('disabled', false);
				$('#tld-checkboxes input[value="' + tld + '"]').parent().show();
				if (extension_type == 'all')
					$('#tld-checkboxes input[value="' + tld + '"]').prop('checked', true);
					
				$('#first_tld option[value="' + tld + '"]').prop('disabled', false);
			});
			
			$.each(already_selected, function(k, v) {
				if ($(v).is(':visible'))
					$(v).prop('checked', true);
			});
		}

		$('#domain_search_form').submit();
	});
})

function validate_langtag() {
	var ret = true;
	$('.domains-result-table p.langtag select:visible').each(function() {
		if ($(this).attr('name').match(/^xn--[a-zA-Z0-9-]+/) && ($(this).val() == null)) {
			$(this).focus();
			ret = false;
		}
	});
	return ret;
}

function langtag_required_func(sld) {
	if (typeof sld == 'undefined')
		var sld = domain_search_get_sld();

	if (sld.match(/^xn--[a-zA-Z0-9-]+/)) {
		langtag_required = true;
		if (!$('#idn_map').is(':visible')) {
			$('#idn_map').show();
			$('#idn_map select').prop('disabled', false);
			$('#extensions input[name="extension_type"][value="none"]').click();
			$('#tld-checkboxes input').prop('disabled', true);
			$('#tld-checkboxes label, #search_input .show_hide_textarea').hide();
			
			if (sld.match(/\./)) {
				var tmp = sld.split('.');
				tmp.shift();
				var tld = tmp.join('.');
			} else {
				var tld = $('#first_tld').val();
			}
			
			if (tld != '') {
				// generate domain-langtag dropdown if tld is set
				if (typeof langtag_obj.data('default-dropdown') == 'undefined') {
					langtag_obj.data('default-dropdown', langtag_obj.html());
				}
				
				var selected_tlds = [];
				
				var dropdown_html = '';
				$.each(idn_map, function(lang, data) {
					if ($.inArray(tld, data.tlds) >= 0) {
						$.each(data.tlds, function(index, _tld) {
							selected_tlds.push(_tld);
						});
						
						dropdown_html = dropdown_html + '<option value="' + data.tags[1] + '" data-alternative="' + data.tags[0] + '">' + lang + '</option>';
					}
				});
				
				if (dropdown_html != '') {
					langtag_obj.html(langtag_obj.data('default-dropdown') + dropdown_html);
				}

				if (selected_tlds.length) {
					$.each(selected_tlds, function(k, v) {
						var input = $('#tld-checkboxes input[value="' + v + '"]');
						if (input.length) {
							input.prop('disabled', false);
							input.parent().show();
						}
					});
					
					$('#extensions input[name="extension_type"][value="all"]').click();
					$('#tld-checkboxes label, #search_input .show_hide_textarea').hide();					
				}

				// langtag from url
				var _langtag = /langtag=([^&]+)/.exec(location.href);
				if (_langtag != null && _langtag[1] != '') {
					if (langtag_obj.find('[value="' + _langtag[1] + '"]').length)
						langtag_obj.val(_langtag[1]);
					else if (langtag_obj.find('[data-alternative="' + _langtag[1] + '"]').length)
						langtag_obj.val(langtag_obj.find('[data-alternative="' + _langtag[1] + '"]').attr('value'));
				}
			}
		}
			
		langtag = langtag_obj.val();
		
	} else {
		if ($('#idn_map').is(':visible')) {
			$('#idn_map').hide();
	
			if (typeof langtag_obj.data('default-dropdown') != 'undefined')
				langtag_obj.html(langtag_obj.data('default-dropdown'));

			$('#idn_map select').prop('disabled', true);
			$('#tld-checkboxes input').prop('disabled', false);
			$('#tld-checkboxes label, #search_input .show_hide_textarea').show();
			$('#extensions input[name="extension_type"][value="most_popular"]').click();
		}
		
		langtag_required = false;
		langtag = false;
	}
}

function getLangtag(tld) {
	if (typeof langtag_required == 'undefined')
		return false;

	if (langtag_obj.val() == '')
		return false;
	
	if ((typeof idn_iso2_tlds != 'undefined') && ($.inArray(tld, idn_iso2_tlds) >= 0))
		return langtag_obj.find('option:selected').data('alternative');
		
	return langtag_obj.val();	
}
