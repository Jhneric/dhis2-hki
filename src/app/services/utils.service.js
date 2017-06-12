import angular from 'angular';

class Utils {
    constructor() {
    }



    s2ab(s) {
        let buf = new ArrayBuffer(s.length);
        let view = new Uint8Array(buf);
        for (let i = 0; i != s.length; ++i) {
            view[i] = s.charCodeAt(i) & 0xFF;
        }
        return buf;
    }
}


export default angular.module('services.utils', [])
    .service('Utils', Utils)
    .name;