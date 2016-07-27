(function () {
    'use strict';

    angular
    .module('vliller')
    .config([
        '$urlRouterProvider',
        '$stateProvider',
        function (
            $urlRouterProvider,
            $stateProvider) {

        /**
         * Routes
         */
        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'components/home/home.view.html',
                controller: 'HomeController',
                controllerAs: 'HomeCtrl'
            })
        ;
    }]);
}());