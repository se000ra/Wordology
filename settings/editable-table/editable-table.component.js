class EditableTableController
{
    constructor(NgTableParams)
    {
        this.NgTableParams = NgTableParams;
    }

    async onClickRow(row)
    {
        await this.clickRowCallback(row[this.primaryKey]);
        this.updateView();
    }

    deleteRow(row)
    {
        if (confirm(`Do you really want to delete ${row[this.primaryKey]}?`))
        {
            this.dataset = this.dataset.filter(r => r[this.primaryKey] !== row[this.primaryKey]);
            this.deleteRowCallback(row[this.primaryKey]);
            this.updateView();
        }
    }

    updateView()
    {
        this.tableParams.settings().dataset = this.dataset;
        this.tableParams.reload();
    }

    $onInit()
    {
        this.tableParams = new this.NgTableParams({}, { dataset: this.dataset });
        this.ngTableColumns = this.columns.map(
            column => {
                let filter = {};
                filter[column.name] = "text";
                return {
                    field: column.name,
                    title: column.label,
                    sortable: column.name,
                    filter: filter,
                    show: true
                }
            }
        );        
        this.ngTableColumns.push({ dataType: "command" });
        console.log(this.ngTableColumns);
    }

    $onChanges(changes)
    {
    }
}

app.component(
    "editableTable",
    {
        controller: EditableTableController,
        controllerAs: "controller",
        templateUrl: "editable-table/editable-table.html",
        bindings: {
            dataset: "=",
            columns: "<",
            primaryKey: "<",
            clickRowCallback: "<",
            deleteRowCallback: "<",
            paging: "<"
        },
        transclude: true
    }
);