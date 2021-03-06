(function(window, angular)
{
	'use strict';

	angular
		.module('ngToast.directives', ['ngToast.provider'])
		.directive('toast', toast)
		.directive('toastMessage', toastMessage)
		.directive('toastMessage', toastMessageFill)
	;


	function toast(ngToast, $templateCache, $log)
	{
		return {
			replace: true,
			restrict: 'EA',
			template: _getTemplateString(),
			compile: compile
		};

		////
		function compile(tElem, tAttrs)
		{
			if (tAttrs.template)
			{
				var template = $templateCache.get(tAttrs.template);

				if (template) {
					tElem.replaceWith(template);
				} else {
					$log.warn('ngToast: Provided template could not be loaded. ' +
						'Please be sure that it is populated before the <toast> element is represented.');
				}
			}

			return link;


			////
			function link(scope)
			{
				scope.hPos = ngToast.settings.horizontalPosition;
				scope.vPos = ngToast.settings.verticalPosition;
				scope.animation = ngToast.settings.animation;
				scope.messages = ngToast.messages;
			}

		}

		function _getTemplateString()
		{
			return ''+
				'<div class="ng-toast ng-toast--{{hPos}} ng-toast--{{vPos}} {{animation ? \'ng-toast--animate-\' + animation : \'\'}}">' +
					'<ul class="ng-toast__list">' +
						'<toast-message ng-repeat="message in messages" ' + 'message="message">' +
							'<span ng-bind-html="message.content"></span>' +
						'</toast-message>' +
					'</ul>' +
				'</div>'
			;
		}

	}
	toast.$inject = ['ngToast', '$templateCache', '$log'];


	function toastMessage($timeout, $compile, ngToast)
	{
		return {
			replace: true,
			transclude: true,
			priority: 400,
			restrict: 'EA',
			scope: {
				message:'='
			},
			controller: ['$scope', 'ngToast', controller],
			template: _getDefaultTemplate(),
			link: link
		};


		////
		function controller($scope, ngToast)
		{
			$scope.dismiss = function() {
				ngToast.dismiss($scope.message.id);
			};
		}

		function link(scope, element, attrs, ctrl, transclude)
		{
			if (scope.message.compileContent)
			{
				var transcludedEl;

				transclude(scope, function(clone)
				{
					transcludedEl = clone;
					element.children().append(transcludedEl);
				});

				$timeout(function()
				{
					$compile(transcludedEl.contents())(scope.$parent, function(compiledClone){
						transcludedEl.replaceWith(compiledClone);
					});
				}, 0);
			}

			if (scope.message.dismissOnTimeout) {
				$timeout(function() {
					ngToast.dismiss(scope.message.id);
				}, scope.message.timeout);
			}

			if (scope.message.dismissOnClick) {
				_bindDismissActionTo(element);
			}

			if (!scope.message.dismissOnClick && scope.message.dismissButton && scope.message.$$controller)
			{
				if (scope.message.$$promise)
				{
					return scope.message.$$promise.then(function()
					{
						$timeout(function() {
							_bindDismissActionTo(element.find('button').eq(0));
						}, 0);
					});
				}

				$timeout(function() {
					_bindDismissActionTo(element.find('button').eq(0));
				}, 0);
			}


			////
			function _bindDismissActionTo(element)
			{
				element.bind('click', function()
				{
					ngToast.dismiss(scope.message.id);
					scope.$apply();
				});
			}
		}

	}
	toastMessage.$inject = ['$timeout', '$compile', 'ngToast'];


	function toastMessageFill($timeout, $compile, $controller, $log, $templateRequest)
	{
		return {
			restrict: 'EA',
			priority: -400,
			link: link
		};


		////
		function link(scope, $element)
		{
			if (!scope.message.template && scope.message.templateUrl) {
				scope.message.template = scope.message.$$promise = $templateRequest(scope.message.templateUrl);
			}

			if (scope.message.template && !scope.message.controller) {
				return $log.error('[ngToast] Controller is required if you want to use a custom template');
			}

			if (!scope.message.template && scope.message.controller) {
				return $log.error('[ngToast] Template is required if you want to associating a controller with a toast');
			}

			if (!scope.message.template && !scope.message.controller) {
				return;
			}

			if (scope.message.compileContent) {
				return $log.error('[ngToast] `compileContent` option is incompatible with `controller`. Consider removing it.');
			}

			scope.message.$$controller = true;
			var template = scope.message.template;

			if (scope.message.$$promise)
			{
				scope.message.$$promise.then(function(_template){
					template = _template;
					_fillDirective();
				});
			} else {
				_fillDirective();
			}


			////
			function _fillDirective()
			{
				$element.html(_getDefaultTemplate(template));
				var locals = {};
				var link = $compile($element.contents());

				locals.$scope = scope;
				locals.$element = $element;
				var controller = $controller(scope.message.controller, locals);

				if (scope.message.controllerAs) {
					scope[scope.message.controllerAs] = controller;
				}

				link(scope);
			}
		}

	}
	toastMessageFill.$inject = ['$timeout', '$compile', '$controller', '$log', '$templateRequest'];


	////
	function _getDefaultTemplate(customContent)
	{
		return '' +
			'<li class="ng-toast__message {{message.additionalClasses}}">' +
				'<div class="alert alert-{{message.className}}" ng-class="{\'alert-dismissible\': message.dismissButton}">' +
					'<button type="button" class="close" ng-if="message.dismissButton" ng-bind-html="message.dismissButtonHtml" ng-click="!message.dismissOnClick && dismiss()">' +
					'</button>' +
					(customContent || '<span ng-if="!message.compileContent" ng-transclude></span>') +
				'</div>' +
			'</li>'
		;
	}

})(window, window.angular);
