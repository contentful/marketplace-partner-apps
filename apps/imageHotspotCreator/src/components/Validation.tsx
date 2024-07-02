import { EntryCard } from "@contentful/f36-components";
import React from "react";
import "./ImageSelector/selectImage.css";
const ValidationPage = ({missedField,fieldMissing}:any) =>{
    return(
        <>
        {missedField.length > 0 &&
            <div className="missingFieldContainer">
              <div className="missingFieldImageContainer">
                <img src={fieldMissing} alt="Field Missing" style={{ height: "100%" }} />
              </div>
              <div>
                It seems you have missed some fields in this content type which is required to use this custom application.
                <div className="missedListContainer">
                  <EntryCard
                    size="small"
                    contentType="Fields Missing"
                    title={`Name of fields : ${missedField.map((x: any) => x.name)}`}
                    description="Verify the field type should be 'Short text field' in the Content model"
                  />
                </div>
              </div>
            </div>}
        </>
        
    )
}
export default ValidationPage;