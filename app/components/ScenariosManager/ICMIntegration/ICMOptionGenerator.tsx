import dayjs from "dayjs";
import ICMIntegrationAPI from "./ICMIntegrationAPI";
import ICMSearchSelect from "./ICMSearchSelect";

const calculateAge = (birthDate: string) => {
  const birth = dayjs(birthDate, "MM/DD/YYYY");
  const today = dayjs();
  return today.diff(birth, "year");
};

interface DependentInfo {
  personID: string;
  dateOfBirth: string;
  age: number;
  hasPPMBStatus?: boolean;
  hasPWDStatus?: boolean;
  hasWarrant?: boolean;
}

const getDependentInfo = async (personID: string, shouldGetMoreInfo: boolean = false): Promise<DependentInfo> => {
  let contact = await icmAPI.callAPI({
    url: `/Contact/Contact/${personID}`,
  });
  if (Array.isArray(contact)) {
    contact = contact[0];
  }
  let dependentInfo: DependentInfo = {
    personID,
    dateOfBirth: contact["Birth Date"],
    age: calculateAge(contact["Birth Date"]),
  };
  if (shouldGetMoreInfo) {
    let contactMoreInfo = await icmAPI.callAPI({
      url: `/ContactMoreInfo/Contact/${personID}`,
    });
    dependentInfo = {
      ...dependentInfo,
      hasPPMBStatus: contactMoreInfo["PPMB Flag"] === "Y",
      hasPWDStatus: contactMoreInfo["PWD Status"] === "Eligible",
      hasWarrant: contactMoreInfo["O/S Warrant Flag"] === "Y",
    };
  }
  return dependentInfo;
};

const icmAPI = new ICMIntegrationAPI();

export default function ICMOptionGenerator(field: string, updateRawData: (newRawData: object) => void) {
  if (field === "personID") {
    return (
      <ICMSearchSelect
        name={"Contact"}
        fetchOptions={(searchText: string) =>
          icmAPI.callAPIForList({
            url: "/Contact/Contact",
            renderLabel: (item: any) => `${item["First Name"]} ${item["Last Name"]}`,
            searchField: "Last Name",
            searchText,
          })
        }
        onSelect={({ value }) => {
          updateRawData({ personID: value });
        }}
      />
    );
  }
  if (field === "dependentsList" || field === "familyList") {
    return (
      <ICMSearchSelect
        name={"Case"}
        fetchOptions={(searchText: string) =>
          icmAPI.callAPIForList({
            url: "/HLS Case/HLS Case",
            renderLabel: (item: any) => item["Case Num"],
            searchField: "Case Num",
            searchText,
          })
        }
        onSelect={async ({ value }) => {
          const caseContacts = await icmAPI.callAPI({ url: `/HLS Case/HLS Case/${value}/HLS Case Contact` });
          const shouldGetMoreInfo = field === "familyList"; // Get extra info for family list
          // Get all dependents and relevant info
          const caseDependents = Array.isArray(caseContacts)
            ? await Promise.all(
                caseContacts.map(
                  async (contact: any) => await getDependentInfo(contact["Contact Id"], shouldGetMoreInfo)
                )
              )
            : [await getDependentInfo(caseContacts["Contact Id"], shouldGetMoreInfo)];
          console.log("Case Dependents", caseDependents);
          if (shouldGetMoreInfo) {
            // Sort by age to get oldest people first to act as person1 and person2??
            caseDependents.sort((a, b) => b.age - a.age);
          }
          updateRawData({ dependentsList: caseDependents });
        }}
      />
    );
  }
  return false;
}
