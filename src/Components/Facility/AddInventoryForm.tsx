import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import moment from 'moment';
import React, { useCallback, useReducer, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getItems, postInventory } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { SelectField, TextInputField } from "../Common/HelperInputFields";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import { InventoryItemsModel } from "./models";


const initForm = {
  id: "",
  quantity: "",
  unit: "",
  isIncoming: true,
};
const initialState = {
  form: { ...initForm }
};

const inventoryFormReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form
      };
    }
    case "set_error": {
      return {
        ...state,
        errors: action.errors
      };
    }
    default:
      return state;
  }
};

const goBack = () => {
  window.history.go(-1);
};

export const AddInventoryForm = (props: any) => {
  const [state, dispatch] = useReducer(inventoryFormReducer, initialState);
  const { facilityId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<Array<InventoryItemsModel>>([]);
  const [currentUnit, setCurrentUnit] = useState<any>();

  const limit = 14;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getItems({ limit, offset }));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.results);
          dispatch({ type: "set_form", form: { ...state.form, id: res.data.results[0]?.id } });
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, offset]
  );
  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  useEffect(() => {
    // set the default units according to the item
    const item = data.find(item => item.id === state.form.id);
    if (item) {
      dispatch({ type: "set_form", form: { ...state.form, unit: item.default_unit?.id } });
      setCurrentUnit(item.allowed_units);
    }
  }, [state.form.id])

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    const data = {
      quantity: Number(state.form.quantity),
      is_incoming: Boolean(state.form.isIncoming),
      item: Number(state.form.id),
      unit: Number(state.form.unit),
    };
    
    const res = await dispatchAction(postInventory(data, { facilityId }));
    setIsLoading(false);
    if (res && res.data) {
      Notification.Success({
        msg: "Inventory created successfully"
      });
    } else {
      Notification.Success({
        msg: "something went wrong!"
      });
    }
    goBack();

  };

  const handleChange = (e: any) => {
    let form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };


  if (isLoading) {
    return <Loading />;
  }

  return (<div>
    <PageTitle title="Add Inventory" />
    <div className="mt-4">
      <Card>
        <form onSubmit={e => handleSubmit(e)}>
          <CardContent>
            <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <InputLabel id="inventory_name_label">Inventory Name</InputLabel>
                <SelectField
                  name="id"
                  variant="standard"
                  value={state.form.id}
                  options={data.map((e) => { return { id: e.id, name: e.name } })}
                  onChange={handleChange}
                  optionKey="id"
                  optionValue="name"
                // errors={state.errors.isIncoming}
                />
              </div>
              <div>
                <InputLabel id="inventory_description_label">Status:</InputLabel>
                <SelectField
                  name="isIncoming"
                  variant="standard"
                  value={state.form.isIncoming}
                  options={[{ id: true, value: "Incoming" }, { id: false, value: "Outgoing" }]}
                  onChange={handleChange}
                  optionKey="id"
                  optionValue="value"
                // errors={state.errors.isIncoming}
                />
              </div>
              <div>
                <InputLabel id="quantity">Quantity</InputLabel>
                <TextInputField
                  name="quantity"
                  variant="outlined"
                  margin="dense"
                  type="number"
                  value={state.form.quantity}
                  onChange={handleChange}
                  errors=""
                />
              </div>
              <div>
                <InputLabel id="min_stock_label">Unit</InputLabel>
                <SelectField
                  name="unit"
                  variant="standard"
                  value={state.form.unit}
                  options={currentUnit || []}
                  onChange={handleChange}
                  optionKey="id"
                  optionValue="name"
                // errors={state.errors.isIncoming}
                />
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                color="default"
                variant="contained"
                type="button"
                onClick={goBack}
              >Cancel</Button>
              <Button
                color="primary"
                variant="contained"
                type="submit"
                style={{ marginLeft: "auto" }}
                startIcon={<CheckCircleOutlineIcon></CheckCircleOutlineIcon>}
                onClick={e => handleSubmit(e)}
              >Add Inventory</Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  </div>);
};
