# DateTime

The DateTime object is used to obtain plain and formatted local and UTC date/time values.  

The table below lists available fixed `DateTime expressions` that can be used as [Pointer] expressions to obtain the respective date/time values, and sample results of almost **same** date/time. Below the table, there is additional information provided about `custom formatting`.

|Expression|Returns|Sample value|
|----------|-------|-------|
|"dt/unix"|Unix time in milliseconds.|1608428200980|
|"dt/iso"|[ISO 8601][iso] formatted UTC time.|"2020-12-20T01:36:40.981Z"|
|"dt/local"|Local date/time.|"12/20/2020, 2:36:40 AM"|
|"dt/l_time"|Local time.|"02:36:40 GMT+0100 (Central European Standard Time)"|
|"dt/l_date"|Local date.|"Sun Dec 20 2020"|
|"dt/l_ms"|Local milliseconds.|988|
|"dt/l_s"|Local seconds.|40|
|"dt/l_m"|Local minutes.|36|
|"dt/l_h"|Local hours.|2|
|"dt/l_d"|Local day of month.|20|
|"dt/l_M"|Local month. |11|
|"dt/l_y"|Local year.|2020|
|"dt/l_wd"|Local day of week.|0|
|"dt/utc"|UTC date/time.|"Sun, 20 Dec 2020 01:36:40 GMT"|
|"dt/u_time"|UTC time.|"01:36:40 GMT+0100 (Central European Standard Time)"|
|"dt/u_date"|UTC date.|"Sun Dec 20 2020"|
|"dt/u_ms"|UTC milliseconds.|990|
|"dt/u_s"|UTC seconds.|40|
|"dt/u_m"|UTC minutes.|36|
|"dt/u_h"|UTC hours.|1|
|"dt/u_d"|UTC day of month.|20|
|"dt/u_M"|UTC month.|11|
|"dt/u_y"|UTC year.|2020|
|"dt/u_wd"|UTC day of week.|0|

## Custom date/time formatting

It is possible to obtain formatted local and UTC date/time by specifying a format using patterns based on [Unicode Technical Standard #35][uts35].  
Formatting can be achieved by appending a format string in parentheses to the expressions `"dt/local"` and `"dt/utc"`, e.g.:  
`"dt/local(dd.MM.yy)"` would return something like `"20.12.20"`.


[iso]: https://www.w3.org/TR/NOTE-datetime

[Pointer]: Pointer.md

[uts35]: https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table