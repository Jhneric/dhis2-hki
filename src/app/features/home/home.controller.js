import * as xlsx from 'xlsx';

import lf from './lf';
import tt from './tt';
import training from './training'
import meeting from './meeting'
import countryInformation from './country_information'

export default class HomeController {
    constructor($scope, Data, $uibModal, categoryOptionCombos, dataElements, organisationUnits) {

        this.uimodal = $uibModal;
        this.categoryOptionCombos = categoryOptionCombos;
        this.dataElements = dataElements;
        this.organisationUnits = organisationUnits;
        this.api = Data;

        this.selectedSheet = null;
        this.selectedCountry = null;
        this.selectedPeriod = null;

        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.maxSize = 5;

        this.nonExistingOrgUnits = [];

        this.validSheets = ["Country Information", "Trainings", "Meetings", "TT Data Sheet", "LF MMDP Data Sheet"];

        $scope.$watch(() => this.excel, (newVal) => {
            if (newVal) {
                this.wb = xlsx.read(newVal.base64, {
                    type: 'base64',
                    WTF: false
                });

                this.selectedSheet = null;
                this.selectedCountry = null;
                this.selectedPeriod = null;

                this.sheets = this.wb.SheetNames.map(function (name, id) {
                    return {name, id};
                });
                this.countries = null;
                this.periods = null;

                this.data = [];
                this.processedData = {};

            }
        });

        $scope.$watch(() => this.training, (newVal) => {
            if (newVal) {
                this.traingWorkBook = xlsx.read(newVal.base64, {
                    type: 'base64',
                    WTF: false
                });
                this.selectedTrainingSheet = null;
                this.selectedTrainingCountry = null;

                this.trainingSheets = this.traingWorkBook.SheetNames.map(function (name, id) {
                    return {name, id};
                });

                this.trainingCountries = null;

                this.trainingData = [];
                this.processedTrainingData = {};
            }
        });
    }

    setPage(pageNo) {
        this.currentPage = pageNo;
    }

    setItemsPerPage(num) {
        this.itemsPerPage = num;
        this.currentPage = 1;
    }

    open(insertedRecords) {
        let modalInstance = this.uimodal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            template: require('./modal.html'),
            controller: 'ModalController',
            controllerAs: 'alert',
            size: 'sm',
            backdrop: false,
            resolve: {
                items: function () {
                    return insertedRecords;
                }
            }
        });
        modalInstance.result.then(function () {
        }, function () {
        });
    }

    alert(insertedRecords) {
        let modalInstance = this.uimodal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            template: require('./alert-modal.html'),
            controller: 'ModalController',
            controllerAs: 'alert',
            size: 'md',
            backdrop: false,
            resolve: {
                items: function () {
                    return insertedRecords;
                }
            }
        });
        modalInstance.result.then(function () {
        }, function () {
        });
    }

    showCountries() {
        this.periods = [];
        this.data = [];
        this.processedData = {};

        if (this.validSheets.indexOf(this.selectedSheet.name) != -1) {
            this.countries = [{
                name: "Burkina Faso",
                uid: "Lt9iRtYewIY"
            }, {
                name: "Cameroon",
                uid: "SEexdO25pVL"
            }, {
                name: "Ethiopia",
                uid: "UokR5KPRYo4"
            }];

            this.selectedCountry = null;
            this.selectedPeriod = null;
            this.periods = null;
        } else {
            this.alert("Please select valid sheet");
        }
    }

    showTrainingCountries() {
        this.trainingData = [];
        this.processedTrainingData = {};

        this.trainingCountries = [{
            name: "Burkina Faso",
            uid: "Lt9iRtYewIY"
        }, {
            name: "Cameroon",
            uid: "SEexdO25pVL"
        }, {
            name: "Ethiopia",
            uid: "UokR5KPRYo4"
        }];


    }


    showPeriods() {
        this.periods = [{
            uid: "1",
            name: "FY15 SAR I (July 22, 2014 – January 21, 2015)"
        }, {
            uid: "2015AprilS1",
            name: "FY15 SAR II (January 22, 2015 - July 21, 2015)"
        }, {
            uid: "2015AprilS2",
            name: "FY16 SAR I (July 22, 2015 – March 30, 2016)"
        }, {
            uid: "2016AprilS1",
            name: "FY16 SAR II (April 1, 2016 – September 30, 2016)"
        }, {
            uid: "2016AprilS2",
            name: "FY17 SAR I (October 1, 2016 – March 30, 2017)"
        }, {
            uid: "2017AprilS1",
            name: "FY17 SAR II (April 1, 2017 – September 30, 2017)"
        }, {
            uid: "2017AprilS2",
            name: "FY18 SAR I (October 1, 2017 – March 30, 2018)"
        }, {
            uid: "2018AprilS1",
            name: "FY18 SAR II (April 1, 2018 – September 30, 2018)"
        }, {
            uid: "2018AprilS2",
            name: "FY19 SAR I (October 1, 2018 – March 30, 2019)"
        }, {
            uid: "2019AprilS1",
            name: "FY19 SAR II (April 1, 2019 – September 30, 2019)"
        }];

        this.selectedPeriod = null;

        this.data = [];
        this.processedData = {};
    }


    process1(work_sheet, template, row_start, group_column, orgUnitColumn, orgUnitLevel) {
        const columns = _.groupBy(template, group_column);
        const range = xlsx.utils.decode_range(work_sheet['!ref']);
        this.nonExistingOrgUnits = [];
        let data = [];
        for (let R = range.s.r; R <= range.e.r; ++R) {
            if (R >= row_start) {
                let orgUnitCell = xlsx.utils.encode_cell({c: xlsx.utils.decode_col(orgUnitColumn), r: R});
                let orgUnitValue = work_sheet[orgUnitCell];
                if (orgUnitValue) {
                    let orgUnit = this.findOrganisationUnit(orgUnitValue.v, orgUnitLevel);
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        let column = xlsx.utils.encode_col(C);
                        let found = columns[column];
                        let cell = xlsx.utils.encode_cell({c: C, r: R});
                        if (found && work_sheet[cell]) {
                            let cellValue = work_sheet[cell];
                            let value = null;
                            if (cellValue.t === 'n') {
                                if (found[0].percentage) {
                                    value = (parseFloat(cellValue.v) * 100).toFixed(2);
                                }
                                else {
                                    value = Math.round(parseFloat(cellValue.v))
                                }
                            }
                            else {
                                value = cellValue.v;
                                value = String(value).trim();
                            }
                            let displayText = this.findDataElementAndCategoryOptionCombo(found[0].dataElement, found[0].categoryOptionCombo);

                            if (orgUnit) {
                                if (value !== null && value !== "" && displayText) {
                                    data = [...data, {
                                        dataElement: found[0].dataElement,
                                        dataElementName: displayText[0],
                                        cell,
                                        categoryOptionCombo: found[0].categoryOptionCombo,
                                        categoryOptionComboName: displayText[1],
                                        orgUnit: orgUnit ? orgUnit.id : 'Does not much DHIS2 will be ignored',
                                        orgUnitName: orgUnit ? orgUnit.displayName : 'Does not much DHIS2 will be ignored',
                                        value: found[0].data ? found[0].data[value] : value,
                                        period: this.selectedPeriod.uid
                                    }]
                                }
                            } else {
                                this.nonExistingOrgUnits = [...this.nonExistingOrgUnits, orgUnitValue.v]
                            }
                        }
                    }
                }
            }
        }
        return data;
    }

    process2(work_sheet, template, group_column) {
        const range = xlsx.utils.decode_range(work_sheet['!ref']);
        let data = [];
        this.nonExistingOrgUnits = [];
        for (let R = range.s.r; R <= range.e.r; ++R) {
            const columns = template[R + 1];
            if (columns) {
                for (let column of columns) {
                    let excelColumn = column[group_column];
                    if (excelColumn && excelColumn !== '') {
                        let cell = xlsx.utils.encode_cell({c: xlsx.utils.decode_col(excelColumn), r: R});
                        let cellValue = work_sheet[cell];
                        if (cellValue) {
                            let value = null;
                            if (cellValue.t === 'n') {
                                value = Math.round(parseFloat(cellValue.v))
                            } else {
                                value = cellValue.v;
                                value = value.trim();
                            }
                            let displayText = this.findDataElementAndCategoryOptionCombo(column.dataElement, column.categoryOptionCombo);
                            if (value !== null && value !== "" && displayText) {
                                data = [...data, {
                                    dataElement: column.dataElement,
                                    dataElementName: displayText[0],
                                    cell,
                                    categoryOptionCombo: column.categoryOptionCombo,
                                    categoryOptionComboName: displayText[1],
                                    orgUnit: this.selectedCountry.uid,
                                    orgUnitName: this.selectedCountry.name,
                                    value: column.data ? column.data[value] : value,
                                    period: this.selectedPeriod.uid
                                }]
                            }
                        }
                    }
                }
            }
        }
        return data;
    }


    showData() {
        if (this.selectedSheet.name === "TT Data Sheet") {
            if (this.selectedCountry.uid === "UokR5KPRYo4") {
                this.data = this.process1(this.wb.Sheets[this.selectedSheet.name], tt, 4, 'e_col', 'C', 6);
            } else if (this.selectedCountry.uid === "Lt9iRtYewIY") {
                this.data = this.process1(this.wb.Sheets[this.selectedSheet.name], tt, 4, 'b_col', 'B', 5);
            } else if (this.selectedCountry.uid === "SEexdO25pVL") {
                this.data = this.process1(this.wb.Sheets[this.selectedSheet.name], tt, 4, 'c_col', 'B', 5);
            }
        } else if (this.selectedSheet.name === "LF MMDP Data Sheet") {
            if (this.selectedCountry.uid === "UokR5KPRYo4") {
                this.data = this.process1(this.wb.Sheets[this.selectedSheet.name], lf, 4, 'e_col', 'C', 6);
            } else if (this.selectedCountry.uid === "Lt9iRtYewIY") {
                this.data = this.process1(this.wb.Sheets[this.selectedSheet.name], lf, 4, 'b_col', 'B', 5);
            } else if (this.selectedCountry.uid === "SEexdO25pVL") {
                this.data = this.process1(this.wb.Sheets[this.selectedSheet.name], lf, 4, 'c_col', 'B', 5);
            }
        } else if (this.selectedSheet.name === "Trainings") {
            if (this.selectedCountry.uid === "UokR5KPRYo4") {
                this.data = this.process2(this.wb.Sheets[this.selectedSheet.name], training, 'e_col');
            } else if (this.selectedCountry.uid === "Lt9iRtYewIY") {
                this.data = this.process2(this.wb.Sheets[this.selectedSheet.name], training, 'b_col');
            } else if (this.selectedCountry.uid === "SEexdO25pVL") {
                this.data = this.process2(this.wb.Sheets[this.selectedSheet.name], training, 'c_col');
            }
        } else if (this.selectedSheet.name === "Meetings") {
            if (this.selectedCountry.uid === "UokR5KPRYo4") {
                this.data = this.process2(this.wb.Sheets[this.selectedSheet.name], meeting, 'e_col');
            } else if (this.selectedCountry.uid === "Lt9iRtYewIY") {
                this.data = this.process2(this.wb.Sheets[this.selectedSheet.name], meeting, 'b_col');
            } else if (this.selectedCountry.uid === "SEexdO25pVL") {
                this.data = this.process2(this.wb.Sheets[this.selectedSheet.name], meeting, 'c_col');
            }
        } else if (this.selectedSheet.name === "Country Information") {
            if (this.selectedCountry.uid === "UokR5KPRYo4") {
                this.data = this.process2(this.wb.Sheets[this.selectedSheet.name], countryInformation, 'e_col');
            } else if (this.selectedCountry.uid === "Lt9iRtYewIY") {
                this.data = this.process2(this.wb.Sheets[this.selectedSheet.name], countryInformation, 'b_col');
            } else if (this.selectedCountry.uid === "SEexdO25pVL") {
                this.data = this.process2(this.wb.Sheets[this.selectedSheet.name], countryInformation, 'c_col');
            }
        }

        let dataValues = this.data.map(function (data) {
            return {
                dataElement: data.dataElement,
                categoryOptionCombo: data.categoryOptionCombo,
                orgUnit: data.orgUnit,
                value: data.value,
                period: data.period
            }
        });

        this.dataValueSets = {dataValues}

        this.totalItems = this.data.length;

        const nonFound = _.uniq(this.nonExistingOrgUnits);

        if (nonFound.length > 0) {
            this.alert(nonFound);
        }
    }

    showTrainingData() {
        let sheet = this.traingWorkBook.Sheets[this.selectedTrainingSheet.name];
        const range = xlsx.utils.decode_range(sheet['!ref']);
        let data = [];
        let orgUnitCell = 2;

        var periods = [];

        for (var p = 3; p <= 14; p++) {
            let cell = xlsx.utils.encode_cell({c: p, r: 6});
            if (sheet[cell]) {
                var dt = xlsx.SSF.parse_date_code(sheet[cell].v, {
                    date1904: false
                });
                if (dt.m < 10) {
                    periods.push(dt.y + '0' + dt.m);
                } else {
                    periods.push(dt.y + '' + dt.m);
                }
            }
        }

        let partners = {
            'HKI': 'ToT32',
            'HI': 'ToT35',
            'World Bank': 'ToT41',
            'Autre': 'ToT36',
            'Sightsavers': 'ToT37',
            'FHF': 'ToT34',
            'LFTW': 'ToT39',
            'RTI': 'ToT40',
            'Other': 'ToT41',
            'No value': 'No value'
        };

        let orgUnitLevel = 6;

        if (this.selectedTrainingCountry.uid === "UokR5KPRYo4") {
            orgUnitLevel = 7;
        }

        for (var R = range.s.r; R <= range.e.r; ++R) {
            var locationCell = xlsx.utils.encode_cell({c: orgUnitCell, r: (R + 7)});
            if (sheet[locationCell]) {
                let org = sheet[locationCell].v;
                let orgFound = this.findOrganisationUnit(org, orgUnitLevel);
                if (orgFound) {
                    for (var C = range.s.c; C <= range.e.c; ++C) {
                        let cell = xlsx.utils.encode_cell({c: C, r: (R + 7)});
                        if (sheet[cell] && C > 2) {
                            let displayText = this.findDataElementAndCategoryOptionCombo("Va7R4NYKQq4", "INgVh9IjrCz");
                            let displayText2 = this.findDataElementAndCategoryOptionCombo("gfnOeJ7XrwU", "INgVh9IjrCz");

                            var d = {
                                orgUnit: orgFound ? orgFound.id : 'Does not much DHIS2 will be ignored',
                                orgUnitName: orgFound ? orgFound.displayName : 'Does not much DHIS2 will be ignored',
                                period: periods[(C - 3)],
                                categoryOptionCombo: "INgVh9IjrCz",
                                categoryOptionComboName: displayText[1],
                                value: sheet[cell].t === 'n' ? Math.round(sheet[cell].v) : sheet[cell].v,
                                dataElement: "Va7R4NYKQq4",
                                dataElementName: displayText[0],
                                cell
                            };
                            var d2 = {
                                orgUnit: orgFound ? orgFound.id : 'Does not much DHIS2 will be ignored',
                                orgUnitName: orgFound ? orgFound.displayName : 'Does not much DHIS2 will be ignored',
                                period: periods[(C - 3)],
                                categoryOptionCombo: "INgVh9IjrCz",
                                categoryOptionComboName: displayText2[1],
                                value: sheet['A4'] ? partners[sheet['A4'].v.split(':')[1].trim()] : sheet[cell].v,
                                dataElement: "gfnOeJ7XrwU",
                                dataElementName: displayText2[0],
                                cell
                            };

                            data = [...data, d, d2];
                        }
                    }
                }
            }
        }
        this.traingData = data;
        this.totalItems = data.length;

        let dataValues = this.traingData.map(function (data) {
            return {
                dataElement: data.dataElement,
                categoryOptionCombo: data.categoryOptionCombo,
                orgUnit: data.orgUnit,
                value: data.value,
                period: data.period
            }
        });

        this.trainingDataValueSets = {dataValues}
    }

    findDataElementAndCategoryOptionCombo(dataElementId, categoryOptionComboId) {
        let dataElements = _.groupBy(this.dataElements, 'id');
        let categoryOptionCombs = _.groupBy(this.categoryOptionCombos, 'id');

        let foundDataElement = dataElements[dataElementId];
        let foundCategoryOptionCombo = categoryOptionCombs[categoryOptionComboId];

        if (foundDataElement && foundCategoryOptionCombo) {
            return [foundDataElement[0].displayName, foundCategoryOptionCombo[0].displayName];
        }
    }

    findOrganisationUnit(name, level) {
        return this.organisationUnits.find(function (orgUnit) {
            return (orgUnit.level === level && orgUnit.displayName.toLowerCase().trim() === name.toLowerCase().trim());
        });
    }

    reset() {
        this.excel = null;
        this.data = null;
        this.selectedPeriod = null;
        this.selectedSheet = null;
        this.selectedCountry = null;
        this.dataValueSets = null;

        this.periods = null;
        this.countries = null;
        this.sheets = null;
    }

    resetTraining() {
        this.training = null;
        this.selectedTrainingCountry = null;
        this.selectedTrainingSheet = null;
        this.trainingDataValueSets = null;
        this.traingData = null;
        this.trainingSheets = null;

    }

    onSubmit() {
        if (this.dataValueSets) {
            this.api.post('dataValueSets', angular.toJson(this.dataValueSets)).then((insertedRecords) => {
                this.open(insertedRecords);
            });

            this.reset();
        }
    }

    onSubmitTraining() {
        if (this.trainingDataValueSets) {
            this.api.post('dataValueSets', angular.toJson(this.trainingDataValueSets)).then((insertedRecords) => {
                this.open(insertedRecords);
            });
            this.resetTraining();
        }
    }
}

HomeController.$inject = ['$scope', 'Data', '$uibModal', 'categoryOptionCombos', 'dataElements', 'organisationUnits'];
