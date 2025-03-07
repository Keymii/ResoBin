import { LoadingOutlined } from '@ant-design/icons'
import { ChevronLeft, ChevronRight, X } from '@styled-icons/heroicons-outline'
import { Spin, Alert } from 'antd'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'

import {
  Aside,
  Card,
  LoaderAnimation,
  PageHeading,
  PageTitle,
  toast,
} from 'components/shared'
import { ButtonIcon, ButtonIconDanger } from 'components/shared/Buttons'
import { API } from 'config/api'
import { slots } from 'data/timetable'
import { displayYear, coursePageUrl } from 'helpers'
import { useQueryString } from 'hooks'
import {
  selectCourseAPILoading,
  selectCourseTitle,
  selectSemesters,
} from 'store/courseSlice'
import { updateTimetable } from 'store/userSlice'

import CurrentTime from './CurrentTime'
import TimetableCourseItem from './TimetableCourseItem'
import TimetableDownloadLink from './TimetableDownloadLink'
import TimetableLayout from './TimetableLayout'
import TimetableSearch from './TimetableSearch'
import TimetableShareButton from './TimetableShareButton'

const TimetableAsideItem = ({ code, handleRemove, loading }) => {
  const title = useSelector(selectCourseTitle(code))

  return (
    <StyledLink to={coursePageUrl(code, title)}>
      <Card hoverable>
        <Card.Meta
          title={
            <TimetableCardTitle>
              {code}

              <ButtonIconDanger
                tooltip="Remove from timetable"
                icon={<X size="24" />}
                onClick={handleRemove}
                disabled={loading}
                hoverstyle={{ background: 'rgba(0, 0, 0, 0.3)' }}
              />
            </TimetableCardTitle>
          }
          description={title}
        />
      </Card>
    </StyledLink>
  )
}

const StyledLink = styled(Link)`
  &:hover {
    text-decoration: none;
  }
`

let ajaxRequest = null
const TimetableContainer = () => {
  const dispatch = useDispatch()
  const semesterList = useSelector(selectSemesters)
  const courseAPILoading = useSelector(selectCourseAPILoading)

  const [courseTimetableList, setCourseTimetableList] = useState([])
  const [loading, setLoading] = useState(courseAPILoading)
  const [semIdx, setSemIdx] = useState(null)

  const { getQueryString } = useQueryString()

  const [courseData, setCourseData] = useState([])
  const [loadingg, setLoadingg] = useState(true)

  const fetchCourses = async (params) => {
    setLoadingg(true)

    try {
      if (ajaxRequest) ajaxRequest.cancel()
      ajaxRequest = axios.CancelToken.source()

      const response = await API.courses.list({
        params,
        cancelToken: ajaxRequest.token,
      })
      setCourseData(response)
    } catch (error) {
      if (axios.isCancel(error)) return
      toast({ status: 'error', content: error })
    }

    setLoadingg(false)
  }

  useEffect(() => {
    const filter = getQueryString()
    const params = {
      search_fields: 'code,title,description',
      q: filter.q,
    }

    fetchCourses(params)
  }, [getQueryString])

  useEffect(() => {
    if (semesterList.length) setSemIdx(semesterList.length - 1)
  }, [semesterList])

  useEffect(() => {
    const fetchUserTimetable = async (_semester) => {
      try {
        setLoading(true)
        const response = await API.profile.timetable.read(_semester)
        setCourseTimetableList(response)
      } catch (error) {
        toast({ status: 'error', content: error })
      } finally {
        setLoading(false)
      }
    }

    if (semIdx !== null) fetchUserTimetable(semesterList[semIdx])
    else setLoading(true)
  }, [semesterList, semIdx])

  const handleClickPrev = () =>
    semIdx - 1 in semesterList && setSemIdx(semIdx - 1)
  const handleClickNext = () =>
    semIdx + 1 in semesterList && setSemIdx(semIdx + 1)

  const removeFromTimetable = (id) => async () => {
    try {
      setLoading(true)
      await API.profile.timetable.remove({ id })

      setCourseTimetableList(
        courseTimetableList.filter((item) => item.id !== id)
      )
      dispatch(updateTimetable(id))
    } catch (error) {
      toast({ status: 'error', content: error })
    } finally {
      setLoading(false)
    }
  }

  const getSlotClashes = () => {
    const courseAndSlotList = []
    courseTimetableList.forEach(({ course, lectureSlots }) => {
      lectureSlots.forEach((lecSlot) => {
        courseAndSlotList.push({
          course,
          slotName: lecSlot,
        })
      })
    })
    const courseTimetableSlots = courseAndSlotList
      .map(({ course, slotName }) => ({
        course,
        slotName,
        grid: slots[slotName],
      }))
      .sort(
        (a, b) =>
          a.grid.col * 1000 +
          a.grid.row.start -
          (b.grid.col * 1000 + b.grid.row.start)
      )
    const clashes = []
    for (let i = 1; i < courseTimetableSlots.length; i += 1) {
      const prev = courseTimetableSlots[i - 1]
      const next = courseTimetableSlots[i]
      if (
        prev.grid.col === next.grid.col &&
        prev.grid.row.end > next.grid.row.start
      )
        clashes.push({
          first: courseTimetableSlots[i - 1],
          second: courseTimetableSlots[i],
        })
    }
    return clashes
  }

  const slotClashWarnings = (clashes) => {
    const warnings = []
    clashes.forEach((clash) => {
      const { first } = clash
      const { second } = clash
      warnings.push(`${first.course} (Slot ${first.slotName})
      is clashing with ${second.course} (Slot ${second.slotName})`)
    })
    return warnings
  }

  const warnings = slotClashWarnings(getSlotClashes())

  return (
    <>
      <PageHeading>
        <PageTitle>Timetable</PageTitle>
      </PageHeading>
      {semesterList[semIdx] && (
        <TimetableSemesterHeader>
          <TimetableDownloadLink coursesInTimetable={courseTimetableList} />

          <TimetableSemesterTitle>
            <ButtonIcon
              icon={<ChevronLeft size="20" />}
              onClick={handleClickPrev}
              disabled={loading || !(semIdx - 1 in semesterList)}
              hoverstyle={{ background: 'rgba(0, 0, 0, 0.3)' }}
            />
            {semesterList[semIdx].season}&nbsp;
            {displayYear(semesterList[semIdx])}
            <ButtonIcon
              icon={<ChevronRight size="20" />}
              disabled={loading || !(semIdx + 1 in semesterList)}
              onClick={handleClickNext}
              hoverstyle={{ background: 'rgba(0, 0, 0, 0.3)' }}
            />
          </TimetableSemesterTitle>

          <TimetableShareButton coursesInTimetable={courseTimetableList} />
        </TimetableSemesterHeader>
      )}
      <TimetableSearch
        loading={loadingg}
        setLoading={setLoadingg}
        data={courseData}
      />
      {loading && <LoaderAnimation />}
      <Spin
        spinning={loading}
        indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
      >
        <TimetableLayout>
          {courseTimetableList.map((item) => (
            <TimetableCourseItem key={item.id} data={item} />
          ))}

          <CurrentTime mode="vertical" />
        </TimetableLayout>
      </Spin>
      <Aside title="My courses" loading={loading}>
        <ClashAlerts>
          {!loading &&
            warnings.map((warning) => (
              <Alert
                message="Warning"
                description={warning}
                type="warning"
                showIcon
                closable
              />
            ))}
        </ClashAlerts>

        <AsideList>
          {!loading &&
            courseTimetableList.map(({ id, course }) => (
              <TimetableAsideItem
                key={id}
                code={course}
                handleRemove={removeFromTimetable(id)}
                loading={loading}
              />
            ))}
        </AsideList>
      </Aside>
    </>
  )
}

export default TimetableContainer

const TimetableSemesterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`

const TimetableSemesterTitle = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: ${({ theme }) => theme.textColor};
  font-size: 1.25rem;
  text-transform: capitalize;
`

const AsideList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 13.6rem;
`

const TimetableCardTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const ClashAlerts = styled.div`
  margin-top: 1rem;
`
