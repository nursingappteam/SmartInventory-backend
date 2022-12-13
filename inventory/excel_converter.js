//This file contains the code for converting the inventory data to excel format for sending to the client

var XLSX = require('xlsx');
//var fs = require('fs');

/*
Existing tables
1) assets
2) approval_statuses
3) checkouts
4) users
5) user_types
6) sessions
7) email_verification
*/
//This function converts the inventory data to excel format and returns file path
//get excel file the entire database except for the passwords
//get the data from the database
let getInventoryData = (db) => {
    // let assetData = db.prepare(`SELECT * FROM assets`).all();
    // let assetDataJSON = JSON.stringify(assetData);
    // let assetDataJSONParsed = JSON.parse(assetDataJSON);
    //Get the data from the database
    //Each table will be a worksheet
    //Get the data from the assets table
    let assetData = db.prepare(`SELECT * FROM assets`).all();
    //Get the data from the approval_statuses table
    let approvalStatusesData = db.prepare(`SELECT * FROM approval_statuses`).all();
    //Get the data from the checkout table
    let checkoutData = db.prepare(`SELECT * FROM checkouts`).all();
    //Get the data from the users table
    let usersData = db.prepare(`SELECT * FROM users`).all();
    //Get the data from the user_types table
    let userTypesData = db.prepare(`SELECT * FROM user_types`).all();
    
    //Now convert the data to JSON format
    let assetDataJSON = JSON.parse(JSON.stringify(assetData));
    let approvalStatusesDataJSON = JSON.parse(JSON.stringify(approvalStatusesData));
    let checkoutDataJSON = JSON.parse(JSON.stringify(checkoutData));
    let usersDataJSON = JSON.parse(JSON.stringify(usersData));
    let userTypesDataJSON = JSON.parse(JSON.stringify(userTypesData));

    //Now convert the JSON data to excel format
    let workbook = XLSX.utils.book_new();
    //Create the worksheets
    let assetWorksheet = XLSX.utils.json_to_sheet(assetDataJSON);
    let approvalStatusesWorksheet = XLSX.utils.json_to_sheet(approvalStatusesDataJSON);
    let checkoutWorksheet = XLSX.utils.json_to_sheet(checkoutDataJSON);
    let usersWorksheet = XLSX.utils.json_to_sheet(usersDataJSON);
    let userTypesWorksheet = XLSX.utils.json_to_sheet(userTypesDataJSON);

    //Add the worksheets to the workbook
    XLSX.utils.book_append_sheet(workbook, assetWorksheet, 'Assets');
    XLSX.utils.book_append_sheet(workbook, approvalStatusesWorksheet, 'Approval Statuses');
    XLSX.utils.book_append_sheet(workbook, checkoutWorksheet, 'Checkout');
    XLSX.utils.book_append_sheet(workbook, usersWorksheet, 'Users');
    XLSX.utils.book_append_sheet(workbook, userTypesWorksheet, 'User Types');

    //Write the workbook to a file
    let filePath = './inventory/spreadsheet_backups/inventory_data.xlsx';
    XLSX.writeFile(workbook, filePath);

    return filePath;
}



module.exports = {
    getInventoryData: getInventoryData
}