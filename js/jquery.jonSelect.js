(function(factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else {
		factory(window.jQuery || window.Zepto || window.$);
	};
}(function($) {
	var jonSelect = function() {
		var self = this;
		var dom, settings, callback;

		// 分配参数
		for (var i = 0, l = arguments.length; i < l; i++) {
			if (jonSelect.isJquery(arguments[i]) || jonSelect.isZepto(arguments[i])) {
				dom = arguments[i];
			} else if (jonSelect.isElement(arguments[i])) {
				dom = $(arguments[i]);
			} else if (typeof arguments[i] === 'function') {
				callback = arguments[i];
			} else if (typeof arguments[i] === 'object') {
				settings = arguments[i];
			};
		};

		var api = new jonSelect.init(dom, settings);

		if (typeof callback === 'function') {
			callback(api);
		};

		return api;
	};

	jonSelect.isElement = function(o){
		if (o && (typeof HTMLElement === 'function' || typeof HTMLElement === 'object') && o instanceof HTMLElement) {
			return true;
		} else {
			return (o && o.nodeType && o.nodeType === 1) ? true : false;
		};
	};

	jonSelect.isJquery = function(o){
		return (o && o.length && (typeof jQuery === 'function' || typeof jQuery === 'object') && o instanceof jQuery) ? true : false;
	};

	jonSelect.isZepto = function(o){
		return (o && o.length && (typeof Zepto === 'function' || typeof Zepto === 'object') && Zepto.zepto.isZ(o)) ? true : false;
	};

	jonSelect.getData = function(o) {
		console.log(o);
		return data;
	};

	jonSelect.init = function(dom, settings) {
		var self = this;
		if (!jonSelect.isJquery(dom) && !jonSelect.isZepto(dom)) {return};
		var theSelect = {
			dom: {
				box: dom
			}
		};
		self.attach = jonSelect.attach.bind(theSelect);
		self.detach = jonSelect.detach.bind(theSelect);
		self.setOptions = jonSelect.setOptions.bind(theSelect);
		self.clear = jonSelect.clear.bind(theSelect);
		theSelect.changeEvent = function() {
			jonSelect.selectChange.call(theSelect, this.className);
		};
		theSelect.settings = $.extend({}, $.jonSelect.defaults, settings, {
			url: theSelect.dom.box.data('url'),
			emptyStyle: theSelect.dom.box.data('emptyStyle'),
			required: theSelect.dom.box.data('required'),
			firstTitle: theSelect.dom.box.data('firstTitle'),
			firstValue: theSelect.dom.box.data('firstValue'),
			jsonName: theSelect.dom.box.data('jsonName'),
			jsonSub: theSelect.dom.box.data('jsonSub')
		});
		var _dataSelects = theSelect.dom.box.data('selects');
		if (typeof _dataSelects === 'string' && _dataSelects.length) {
			theSelect.settings.selects = _dataSelects.split(',');
		};
		self.setOptions();
		self.attach();
		if (!theSelect.settings.url && !theSelect.settings.data) {
			// 使用独立接口获取数据
			jonSelect.start.apply(theSelect);
		} else if (theSelect.settings.data) {
			// 设置自定义数据
			jonSelect.start.call(theSelect, theSelect.settings.data);
		} else if (typeof theSelect.settings.url === 'string' && theSelect.settings.url.length) {
			// 设置 URL，通过 Ajax 获取数据
			$.getJSON(theSelect.settings.url, function(json) {
				jonSelect.start.call(theSelect, json);
			});
		};
	};

	// 设置参数
	jonSelect.setOptions = function(opts) {
		var self = this;
		if (opts) {
			$.extend(self.settings, opts);
		};
		// 初次或重设选择器组
		if (!$.isArray(self.selectArray) || !self.selectArray.length || (opts && opts.selects)) {
			self.selectArray = [];
			if ($.isArray(self.settings.selects) && self.settings.selects.length) {
				var _tempSelect;
				for (var i = 0, l = self.settings.selects.length; i < l; i++) {
					_tempSelect = self.dom.box.find('select.' + self.settings.selects[i]);
					if (!_tempSelect || !_tempSelect.length) {break};
					self.selectArray.push(_tempSelect);
				};
			};
		};
		if (opts) {
			if (!$.isArray(opts.data) && typeof opts.url === 'string' && opts.url.length) {
				$.ajax
				$.getJSON(self.settings.url, function(json) {
					jonSelect.start.call(self, json);
				});
			} else {
				jonSelect.start.call(self, opts.data);
			};
		};
	};

	// 绑定
	jonSelect.attach = function() {
		var self = this;
		if (!self.attachStatus) {
			self.dom.box.on('change', 'select', self.changeEvent);
		};
		if (typeof self.attachStatus === 'boolean') {
			jonSelect.start.call(self);
		};
		self.attachStatus = true;
	};

	// 移除绑定
	jonSelect.detach = function() {
		var self = this;
		self.dom.box.off('change', 'select', self.changeEvent);
		self.attachStatus = false;
	};

	// 清空选项
	jonSelect.clear = function(level) {
		var self = this;
		var _style = {
			display: '',
			visibility: ''
		};
		level = isNaN(level) ? 0 : level;
		// 清空后面的 select
		for (var i = level, l = self.selectArray.length; i < l; i++) {
			self.selectArray[i].empty().prop('disabled', true);
			if (self.settings.emptyStyle === 'none') {
				_style.display = 'none';
			} else if (self.settings.emptyStyle === 'hidden') {
				_style.visibility = 'hidden';
			};
			self.selectArray[i].css(_style);
		};
	};

	jonSelect.start = function(data) {
		var self = this;
		self.settings.data = data;
		if (!self.selectArray.length) {return};
		// 保存默认值
		for (var i = 0, l = self.selectArray.length; i < l; i++) {
			if (typeof self.selectArray[i].attr('data-value') !== 'string' && self.selectArray[i][0].options.length) {
				self.selectArray[i].attr('data-value', self.selectArray[i].val());
			};
		};
		if (self.settings.data || (typeof self.selectArray[0].data('url') === 'string' && self.selectArray[0].data('url').length)) {
			jonSelect.getOptionData.call(self, 0, 0);
		} else {
			self.selectArray[0].prop('disabled', false).css({
				'display': '',
				'visibility': ''
			});
		};
	};

	// 获取选项数据,并生成可用数组传入构建函数buildOption
	jonSelect.getOptionData = function(level,id) {
		var self = this;
		if (typeof level !== 'number' || isNaN(level) || level < 0 || level >= self.selectArray.length) {return};
		var _select = self.selectArray[level];
		var _jsonSub = typeof _select.data('jsonSub') === 'undefined' ? self.settings.jsonSub : _select.data('jsonSub');
		var _jsonName = typeof _select.data('jsonName') === 'undefined' ? self.settings.jsonName : _select.data('jsonName');
		var _jsonValue = typeof _select.data('jsonValue') === 'undefined' ? self.settings.jsonValue : _select.data('jsonValue');

		var _selectName;
		var _selectData = [];
		var _levelPrev = level - 1;
		var _dataUrl = _select.data('url');

		var _query = {};
		var _queryName;

		jonSelect.clear.call(self, level);

		if (typeof _dataUrl === 'string' && _dataUrl.length) {
			_queryName = _select.data('query');
			if (_levelPrev >= 0) {
				// 使用独立接口
				if (!self.selectArray[_levelPrev].val().length) {return};
				_selectName = self.selectArray[_levelPrev].attr('name');
				if (typeof _queryName === 'string' && _queryName.length) {
					_query[_queryName] = self.selectArray[_levelPrev].val();
				} else if (typeof _selectName === 'string' && _selectName.length) {
					_query[_selectName] = self.selectArray[_levelPrev].val();
				};
			};
			$.ajax({
				url:_dataUrl,
				data:_query,
				type:'get',
				dataType:'jsonp',
				success:function(json) {
					if (!$.isArray(json) || json.length==0) {return};
					jonSelect.buildOption.call(self, level, json);
				}
			});
		} else if (self.settings.data && typeof self.settings.data === 'object') {
			// 使用整合数据(整合数据的第一个数组的KEY一定要是0，否则找不到下级，也就没有其他的选项了)
			var d = self.settings.data;
			if (id==='') {return};
			var s=d[id][_jsonSub];
			if (!$.isArray(s)) {return};
			for(var i in s){
				item=d[s[i]];
				item[_jsonValue]=s[i];
				_selectData.push(item);
			}
			jonSelect.buildOption.call(self, level, _selectData);
		};
	};

	// 构建选项列表
	jonSelect.buildOption = function(level, data) {
		//console.log(data);
		var self = this;
		var _select = self.selectArray[level];
		var _required = typeof _select.data('required') === 'boolean' ? _select.data('required') : self.settings.required;
		var _firstTitle = typeof _select.data('firstTitle') === 'undefined' ? self.settings.firstTitle : _select.data('firstTitle');
		var _firstValue = typeof _select.data('firstValue') === 'undefined' ? self.settings.firstValue : _select.data('firstValue');
		var _jsonName = typeof _select.data('jsonName') === 'undefined' ? self.settings.jsonName : _select.data('jsonName');
		var _jsonValue = typeof _select.data('jsonValue') === 'undefined' ? self.settings.jsonValue : _select.data('jsonValue');

		if (!$.isArray(data)) {return};
		var _html = !_required ? '<option value="' + String(_firstValue) + '">' + String(_firstTitle) + '</option>' : '';
		// 区分标题、值的数据
		for(var i in data){
			_html += '<option value="' + String(data[i][_jsonValue]) + '">' + String(data[i][_jsonName]) + '</option>';
		}
		_select.html(_html).prop('disabled', false).css({
			'display': '',
			'visibility': ''
		});
		// 初次加载设置默认值
		if (typeof _select.attr('data-value') === 'string') {
			_select.val(String(_select.attr('data-value'))).removeAttr('data-value');

			if (_select[0].selectedIndex < 0) {
				_select[0].options[0].selected = true;
			};
		};
		if (_required || _select[0].selectedIndex > 0) {
			_select.trigger('change');
		};
	};

	// 改变选择时的处理
	jonSelect.selectChange = function(name) {
		var self = this;
		if (typeof name !== 'string' || !name.length) {return};
		var id=$("."+name).val();
		var level;
		name = name.replace(/\s+/g, ',');
		name = ',' + name + ',';
		// 获取当前 select 位置
		for (var i = 0, l = self.selectArray.length; i < l; i++) {
			if (name.indexOf(',' + self.settings.selects[i] + ',') > -1) {
				level = i;
				break;
			};
		};
		if (typeof level === 'number' && level > -1) {
			level += 1;
			jonSelect.getOptionData.call(self, level, id);
		};
	};

	$.jonSelect = function() {
		return jonSelect.apply(this, arguments);
	};

	// 默认值
	$.jonSelect.defaults = {
		selects: [],						// 下拉选框组
		url: null,							// 列表数据文件路径（URL）或数组数据
		data: null,							// 自定义数据
		emptyStyle: true,			 		// 无数据状态显示方式
		required: false,					// 是否为必选
		firstTitle: '请选择',				// 第一个选项的标题
		firstValue: '',				 		// 第一个选项的值
		jsonName: 'c',						// 数据标题字段名称
		jsonSub: 's',						// 子集数据字段名称
		jsonValue: 'v',						// 数据值字段名称
	};

	$.fn.jonSelect = function(settings, callback) {
		this.each(function(i) {
			$.jonSelect(this, settings, callback);
		});
		return this;
	};
}));
