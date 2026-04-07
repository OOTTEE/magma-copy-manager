
AÑADIR PRODUCTO

POST <https://spaces.nexudus.com/api/billing/coworkerProducts>

```JSON
{"TypeName":"coworkerProduct","Id":0,"CoworkerId":1415688513,"BusinessId":396822437,"ProductId":454005557,"Notes":"test","InvoiceThisCoworker":false,"Quantity":1,"SaleDate":"2026-04-06T12:35:11.100Z","IssuedById":396822437,"CurrencyId":3003,
    "s_coworker":"{\"query\":[{\"name\":\"TariffId\",\"value\":\"notnull\",\"type\":\"entity\", \"foreignEntityName\":\"tariff\"},{\"name\":\"GlobalSearch\",\"value\":\"javier\",\"type\":\"string\",\"exactStringMatch\":false},{\"name\":\"Archived\",\"value\":false,\"type\":\"boolean\"}],\"orderBy\":\"RegistrationDate\",\"dir\":1,\"size\":15}",
    "s_coworkerproduct":"{\"query\":[{\"name\":\"CoworkerId\",\"value\":1415688513,\"type\":\"entity\",\"foreignEntityName\":\"coworker\"},{\"name\":\"Invoiced\",\"value\":false,\"type\":\"boolean\"},{\"name\":\"Archived\",\"value\":false,\"type\":\"boolean\"}],\"orderBy\":\"CreatedOn\",\"dir\":1,\"size\":15}"}
```

```JSON
{
    "Status":200,
    "Message":"Product Sale \"Impresión A3 B/N\" was successfully created.",
    "Value":{
        "CoworkerId":1415688513,
        "CoworkerCoworkerType":"Individual",
        "CoworkerFullName":"Javier Lorenzo Martin",
        "CoworkerCompanyName":"Iriusrisk",
        "CoworkerBillingName":"Javier Lorenzo Martin",
        "CoworkerEmail":"javier.ote.ote@gmail.com",
        "BusinessId":396822437,
        "ProductId":454005557,
        "ProductName":"Impresión A3 B/N",
        "ProductPrice":0.09000,
        "ProductApplyProRating":false,
        "ProductCurrencyCode":"EUR",
        "Notes":"test",
        "PurchaseOrder":null,
        "OrderNumber":null,
        "Activated":false,
        "ActivateNow":false,
        "InvoiceThisCoworker":false,
        "Price":null,
        "Quantity":1,
        "RegularCharge":false,"RepeatCycle":1,"RepeatUnit":null,"InvoiceOn":null,"RepeatFrom":null,"RepeatUntil":null,"SaleDate":"2026-04-06T12:35:11.1Z","DueDate":null,"Invoiced":false,"InvoicedOn":null,"FromTariff":false,"BookingUniqueId":null,"ApplyProRating":false,"CoworkerContractUniqueId":null,"ContractDepositUniqueId":null,"ContractProductUniqueId":null,"CoworkerDeliveryUniqueId":null,"CoworkerInvoiceId":null,"CoworkerInvoiceNumber":null,"CoworkerInvoicePaid":false,"TeamsAtTheTimeOfPurchase":null,"CreditAmount":0.0,"DiscountAmount":0.0,"TotalPrice":0.09000,"UnitPrice":0.09000,"RecurringTotal":0.0,"Id":1427207823,"UpdatedOn":"2026-04-06T12:35:24.0050623Z","CreatedOn":"2026-04-06T12:35:24.0050623Z","UniqueId":"27a47c92-90c2-4e75-81b1-e900daf08b75","UpdatedBy":"javier.ote.ote@gmail.com","IsNew":false,"SystemId":null,"ToStringText":"#1427207823","LocalizationDetails":null,"CustomFields":null},"OpenInDialog":false,"OpenInWindow":false,"RedirectURL":null,"JavaScript":null,"UpdatedOn":"2026-04-06T12:35:24.0050623Z","UpdatedBy":"javier.ote.ote@gmail.com","Errors":null,"WasSuccessful":true}
```
