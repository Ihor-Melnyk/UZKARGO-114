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
