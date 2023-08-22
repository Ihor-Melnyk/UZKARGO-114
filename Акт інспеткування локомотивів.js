//Скрипт 1. Вирахування ПДВ акту
function calculationActAmount() {
  let VATpercentage = 0;
  const attrVATAmount = EdocsApi.getAttributeValue("ActVATAmount");
  const attrVATpercentage = EdocsApi.getAttributeValue("ActVATPercent");
  const attrContractAmount = EdocsApi.getAttributeValue("AccountAct");
  const attrAmountOutVAT = EdocsApi.getAttributeValue("ActAmountOutVAT");

  switch (attrVATpercentage.value) {
    case "20%": // if (x === 'если сумма НДС=20%')
      VATpercentage = 1.2;
      break;

    case "7%": // if (x === 'если сумма НДС=7%')
      VATpercentage = 1.07;
      break;
  }

  if (attrVATpercentage.value === null || attrContractAmount.value === null) {
    // если нет ставки НДС и суммы, то укажем ноль в сумме НДС и без НДС
    attrVATAmount.value = 0;
    attrAmountOutVAT.value = 0;
  } else if (VATpercentage == 0) {
    attrVATAmount.value = 0;
    attrAmountOutVAT.value = attrContractAmount.value;
  } else {
    attrAmountOutVAT.value = Math.floor((100 * attrContractAmount.value) / VATpercentage) / 100;
    attrVATAmount.value = attrContractAmount.value - attrAmountOutVAT.value;
  }

  EdocsApi.setAttributeValue(attrVATAmount);
  EdocsApi.setAttributeValue(attrAmountOutVAT);
}

function onChangeAccountAct() {
  calculationActAmount();
}

function onChangeActVATPercent() {
  calculationActAmount();
}

//Скрипт 2. Передача акту для підписання Контрагенту в зовнішню систему
function setDataForESIGN() {
  debugger;
  var registrationDate = EdocsApi.getAttributeValue("ActNumber").value;
  var registrationNumber = EdocsApi.getAttributeValue("ActDate").value;
  var caseType = EdocsApi.getAttributeValue("DocType").value;
  var caseKind = EdocsApi.getAttributeValue("DocKind").text;
  var name = "";
  if (caseKind) {
    name += caseKind;
  } else {
    name += caseType;
  }
  name += " №" + (registrationNumber ? registrationNumber : CurrentDocument.id) + (!registrationDate ? "" : " від " + moment(registrationDate).format("DD.MM.YYYY"));
  doc = {
    DocName: name,
    extSysDocId: CurrentDocument.id,
    ExtSysDocVersion: CurrentDocument.version,
    docType: "act",
    docDate: registrationDate,
    docNum: registrationNumber,
    File: "",
    parties: [
      {
        taskType: "ToSign",
        taskState: "Done",
        legalEntityCode: EdocsApi.getAttributeValue("OrgCode").value,
        contactPersonEmail: EdocsApi.getAttributeValue("OrgRPEmail").value,
        signatures: [],
      },
      {
        taskType: "ToSign",
        taskState: "NotAssigned",
        legalEntityCode: EdocsApi.getAttributeValue("ContractorEDRPOU").value,
        contactPersonEmail: EdocsApi.getAttributeValue("ContractorRPEmail").value,
        expectedSignatures: [],
      },
    ],
    additionalAttributes: [
      {
        code: "docDate",
        type: "dateTime",
        value: registrationDate,
      },
      {
        code: "docNum",
        type: "string",
        value: registrationNumber,
      },
    ],
    sendingSettings: {
      attachFiles: "fixed", //, можна також встановлювати 'firstOnly' - Лише файл із першої зафіксованої вкладки(Головний файл), або 'all' - всі файли, 'fixed' - усі зафіксовані
      attachSignatures: "signatureAndStamp", // -'signatureAndStamp'Типи “Підпис” або “Печатка”, можна також встановити 'all' - усі типи цифрових підписів
    },
  };
  EdocsApi.setAttributeValue({ code: "JSON", value: JSON.stringify(doc) });
}

function onTaskExecuteSendOutDoc(routeStage) {
  debugger;
  if (routeStage.executionResult == "rejected") {
    return;
  }
  setDataForESIGN();
  var idnumber = EdocsApi.getAttributeValue("DocId");
  var methodData = {
    extSysDocId: idnumber.value,
  };

  routeStage.externalAPIExecutingParams = {
    externalSystemCode: "ESIGN1", // код зовнішньої системи
    externalSystemMethod: "integration/importDoc", // метод зовнішньої системи
    data: methodData, // дані, що очікує зовнішня система для заданого методу
    executeAsync: true, // виконувати завдання асинхронно
  };
}

function onTaskCommentedSendOutDoc(caseTaskComment) {
  debugger;
  var orgCode = EdocsApi.getAttributeValue("OrgCode").value;
  var orgShortName = EdocsApi.getAttributeValue("OrgShortName").value;
  if (!orgCode || !orgShortName) {
    return;
  }
  var idnumber = EdocsApi.getAttributeValue("DocId");
  var methodData = {
    extSysDocId: idnumber.value,
    eventType: "CommentAdded",
    comment: caseTaskComment.comment,
    partyCode: orgCode,
    userTitle: CurrentUser.name,
    partyName: orgShortName,
    occuredAt: new Date(),
  };

  caseTaskComment.externalAPIExecutingParams = {
    externalSystemCode: "ESIGN1", // код зовнішньої системи
    externalSystemMethod: "integration/processEvent", // метод зовнішньої системи
    data: methodData, // дані, що очікує зовнішня система для заданого методу
    executeAsync: true, // виконувати завдання асинхронно
  };
}
