routes.$inject = ['$stateProvider'];

export default function routes($stateProvider) {
    $stateProvider
        .state('home', {
            url: '/',
            template: require('./home.html'),
            resolve: {
                categoryOptionCombos: ['Data', function (Data) {
                    return Data.getMany('categoryOptionCombos', {paging: false, fields: 'id,displayName'});
                }],
                dataElements: ['Data', function (Data) {
                    return Data.getMany('dataElements', {paging: false, fields: 'id,displayName'});
                }],
                organisationUnits: ['Data', function (Data) {
                    return Data.getMany('organisationUnits', {paging: false, fields: 'id,displayName,level'});
                }]
            },
            controller: 'HomeController',
            controllerAs: 'home'
        });
}